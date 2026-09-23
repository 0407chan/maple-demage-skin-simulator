#!/usr/bin/env python3
"""Download the small, fixed map library. Normal builds never use the API."""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import subprocess
import xml.etree.ElementTree as ET
import posixpath
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache
from pathlib import Path
from uuid import uuid4

from PIL import Image
from wz_img_metadata import ImgReader, find_img_node

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / ".cache/maps"
OUTPUT = ROOT / "public/generated/maps"
MANIFEST = ROOT / "src/generated/mapManifest.json"
SELECTIONS = ROOT / "scripts/map-selections.json"
API = "https://maplestory.io/api"
REGION = "GMS"
VERSION = 83
METADATA_COMMIT = "fec53bc7714dc0f1ae3f50b2986cdf2727e0912a"
METADATA_BASE = f"https://raw.githubusercontent.com/P0nk/Cosmic/{METADATA_COMMIT}/wz/Map.wz"
MAPS = {
    100000100: {
        "ko": ["헤네시스 시장", "헤네시스"],
        "en": ["Henesys Market", "Henesys"],
        "ja": ["ヘネシス市場", "ヘネシス"],
        "zh-CN": ["射手村市场", "射手村"],
        "zh-TW": ["弓箭手村商場", "弓箭手村"],
    },
    100000000: {
        "ko": ["헤네시스", "빅토리아 아일랜드"],
        "en": ["Henesys", "Victoria Island"],
        "ja": ["ヘネシス", "ビクトリアアイランド"],
        "zh-CN": ["射手村", "金银岛"],
        "zh-TW": ["弓箭手村", "維多利亞島"],
    },
}


def fetch(url: str) -> bytes:
    path = CACHE / hashlib.sha256(url.encode()).hexdigest()
    if path.exists():
        return path.read_bytes()
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(f".{uuid4().hex}.tmp")
    subprocess.run([
        "curl", "-f", "-sS", "--connect-timeout", "10", "--max-time", "30",
        "--retry", "1", "-A", "maple-damage-skin-simulator-map-assets/1.0",
        url, "-o", str(temporary),
    ], check=True)
    if not temporary.stat().st_size:
        raise ValueError(f"Empty response: {url}")
    temporary.replace(path)
    return path.read_bytes()


def node(url: str) -> dict:
    return json.loads(fetch(url))


def metadata(path: str) -> ET.Element:
    return ET.fromstring(fetch(f"{METADATA_BASE}/{path}.xml"))


def save_image(url: str, relative_path: str) -> Image.Image:
    image = Image.open(io.BytesIO(fetch(url))).convert("RGBA")
    if max(image.size) <= 1 or image.getbbox() is None:
        raise ValueError(f"Blank/placeholder image: {url}")
    path = OUTPUT / relative_path
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, "WEBP", lossless=True, method=6)
    return image


def ground_y(image: Image.Image) -> int:
    width, height = image.size
    alpha = image.getchannel("A")
    candidates = []
    for ratio in [0.44, 0.46, 0.48, 0.5, 0.52, 0.54, 0.56]:
        x = min(width - 1, int(width * ratio))
        for y in range(int(height * 0.25), int(height * 0.96)):
            if alpha.getpixel((x, y)) <= 160 or alpha.getpixel((x, y - 1)) > 160:
                continue
            if sum(alpha.getpixel((x, yy)) > 160 for yy in range(y, min(height, y + 16))) >= 12:
                candidates.append(y)
                break
    if not candidates:
        return round(height * 0.7)
    return min(height - 1, sorted(candidates)[len(candidates) // 2] + 18)


def asset_path(relative: str) -> str:
    return f"generated/maps/{relative}"


def background(map_id: int, entry: ET.Element) -> dict | None:
    properties = {child.get("name"): child.get("value") for child in entry}
    get = lambda key, fallback=0: int(properties.get(key, fallback))
    index = entry.get("name")
    background_set = properties.get("bS")
    if not background_set:
        return None
    # Download the metadata once per IMG, not once per scalar property.
    image_root = metadata(f"Back/{background_set}.img")
    section = "ani" if get("ani") else "back"
    number = get("no")
    frame = image_root.find(f"./imgdir[@name='{section}']/*[@name='{number}']")
    image_path = f"{REGION}/{VERSION}/Map/Back/{background_set}.img/{section}/{number}"
    if frame is None:
        raise ValueError(f"Missing background metadata: {image_path}")
    # Keep the sprite's first frame; camera parallax and scrolling run in the app.
    if section == "ani":
        frames = sorted((child for child in frame if child.get("name", "").isdigit()), key=lambda child: int(child.get("name")))
        frame = frames[0]
        image_path += f"/{frame.get('name')}"
    origin_node = frame.find("./vector[@name='origin']")
    if origin_node is None:
        raise ValueError(f"Missing origin: {image_path}")
    origin = {axis: int(origin_node.get(axis)) for axis in ["x", "y"]}
    relative = f"{map_id}/background-{index}.webp"
    image = save_image(f"{API}/wz/img/{image_path}", relative)
    if image.size != (int(frame.get("width")), int(frame.get("height"))):
        raise ValueError(f"Background image/metadata dimensions disagree: {image_path}")
    return {
        "alpha": max(0, min(1, get("a", 255) / 255)),
        "flip": bool(get("f")), "front": bool(get("front")),
        "imagePath": asset_path(relative), "index": int(index),
        "type": get("type"), "x": get("x"), "y": get("y"),
        "rx": get("rx"), "ry": get("ry"), "cx": get("cx"), "cy": get("cy"),
        "sequence": {"animated": False, "loop": False, "frames": [{
            "src": asset_path(relative), "width": image.width, "height": image.height,
            "origin": origin, "delay": 100,
        }]},
    }


def generate(map_id: int) -> dict:
    print(f"Preparing {map_id} ({MAPS[map_id]['en'][0]})", flush=True)
    map_url = f"{API}/{REGION}/{VERSION}/map/{map_id}"
    detail = node(map_url)
    if detail["name"] != MAPS[map_id]["en"][0]:
        raise ValueError(f"Map ID/name mismatch: {map_id}")
    relative = f"{map_id}/foreground.webp"
    foreground = save_image(f"{map_url}/render", relative)
    mini_map = {key: detail["miniMap"][key] for key in ["centerX", "centerY", "width", "height"]}
    thumbnail = foreground.copy()
    thumbnail.thumbnail((180, 72))
    thumbnail.save(OUTPUT / str(map_id) / "icon.webp", "WEBP", lossless=True)
    padded = str(map_id).zfill(9)
    map_metadata = metadata(f"Map/Map{padded[0]}/{padded}.img")
    # Match the pinned v83 metadata to the source used for the foreground.
    mini_metadata = map_metadata.find("./imgdir[@name='miniMap']")
    for key in ["centerX", "centerY", "width", "height"]:
        if int(mini_metadata.find(f"./int[@name='{key}']").get("value")) != mini_map[key]:
            raise ValueError(f"Map metadata version mismatch: {map_id}/{key}")
    layers = [background(map_id, entry) for entry in map_metadata.find("./imgdir[@name='back']")]
    layers = sorted((layer for layer in layers if layer is not None), key=lambda layer: layer["index"])
    if not layers:
        raise ValueError(f"No background layers: {map_id}")
    first = next(layer for layer in layers if not layer["front"])
    base = Image.open(ROOT / "public" / first["sequence"]["frames"][0]["src"]).convert("RGBA")
    color = base.getpixel((base.width // 2, 0))
    labels = {locale: {"name": names[0], "streetName": names[1]} for locale, names in MAPS[map_id].items()}
    return {
        "id": map_id, **labels["ko"], "labels": labels,
        "foregroundPath": asset_path(relative), "iconPath": asset_path(f"{map_id}/icon.webp"),
        "backgroundColor": f"rgb({color[0]}, {color[1]}, {color[2]})" if color[3] else "#282c34",
        "detail": {"id": map_id, **labels["ko"], "miniMap": mini_map},
        "groundMetrics": {"groundY": ground_y(foreground), "width": foreground.width, "height": foreground.height},
        "backgrounds": layers,
    }


@lru_cache(maxsize=64)
def exported_metadata(path: str, region: str, version: int) -> dict:
    reader = ImgReader(fetch(f"{API}/wz/export/{region}/{version}/{path}?rawImage=true"))
    if reader.string_block() != "Property":
        raise ValueError(f"Unsupported IMG: {path}")
    result = reader.properties()
    # Map exports can be padded to the backing buffer size. Reject nonzero tails.
    if any(reader.data[reader.position:]):
        raise ValueError(f"Unexpected trailing IMG data: {path}")
    return result


def sprite_frame(img_path: str, frame_path: str, region: str, version: int) -> tuple[dict, str]:
    root = exported_metadata(img_path, region, version)
    for _ in range(20):
        frame = find_img_node(root, frame_path)
        if frame["type"] == "Canvas":
            return frame, frame_path
        if frame["type"] == "UOL":
            frame_path = posixpath.normpath(posixpath.join(posixpath.dirname(frame_path), frame["value"]))
        else:
            numeric = [key for key in frame["children"] if key.isdigit()]
            if not numeric:
                raise ValueError(f"Unsupported map sprite: {img_path}/{frame_path}")
            frame_path += f"/{min(numeric, key=int)}"
    raise ValueError(f"Cyclic sprite link: {img_path}/{frame_path}")


def render_map_sprites(meta: dict, detail: dict, region: str, version: int) -> Image.Image:
    """Rebuild the same minimap-sized first-frame foreground as the browser."""
    mini = detail["miniMap"]
    canvas = Image.new("RGBA", (mini["width"], mini["height"]))
    entries = []
    frames = {}
    for layer in range(8):
        data = meta[str(layer)]["children"]
        tile_set = data["info"]["children"].get("tS", {}).get("value")
        for kind in ("obj", "tile"):
            for index, node_entry in data[kind]["children"].items():
                props = {key: node["value"] for key, node in node_entry["children"].items()}
                if kind == "tile":
                    img_path, frame_path = f"Map/Tile/{tile_set}.img", f"{props['u']}/{props['no']}"
                else:
                    if props.get("r"):
                        raise ValueError("Unsupported rotated map object")
                    img_path = f"Map/Obj/{props['oS']}.img"
                    frame_path = f"{props['l0']}/{props['l1']}/{props['l2']}"
                key = (img_path, frame_path)
                if key not in frames:
                    frame, resolved_path = sprite_frame(img_path, frame_path, region, version)
                    children = frame["children"]
                    inlink = children.get("_inlink", {}).get("value")
                    if inlink:
                        source, _ = sprite_frame(img_path, inlink, region, version)
                        image_path = source["children"].get("_outlink", {}).get("value") or f"{img_path}/{inlink}"
                    else:
                        image_path = children.get("_outlink", {}).get("value") or f"{img_path}/{resolved_path}"
                    frames[key] = (children, image_path)
                children, image_path = frames[key]
                z = props.get("z", children.get("z", {}).get("value", 0))
                entries.append(((layer, z, props.get("zM", 0), int(index)), props, key))

    def load_image(path: str) -> tuple[str, Image.Image]:
        image = Image.open(io.BytesIO(fetch(f"{API}/wz/img/{region}/{version}/{path}"))).convert("RGBA")
        if max(image.size) <= 1 or image.getbbox() is None:
            raise ValueError(f"Blank map sprite: {path}")
        return path, image

    paths = sorted({path for _, path in frames.values()})
    print(f"  Rebuilding {len(entries)} placements from {len(paths)} sprites", flush=True)
    with ThreadPoolExecutor(max_workers=6) as pool:
        images = dict(pool.map(load_image, paths))
    for _, props, key in sorted(entries, key=lambda entry: entry[0]):
        children, path = frames[key]
        image = images[path]
        origin = children["origin"]["value"]
        origin_x = origin["x"]
        if props.get("f"):
            image = image.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
            origin_x = image.width - origin_x
        x = props["x"] + mini["centerX"] - origin_x
        y = props["y"] + mini["centerY"] - origin["y"]
        canvas.alpha_composite(image, (x, y))
    if canvas.getbbox() is None:
        raise ValueError("Rebuilt foreground is empty")
    return canvas


def read_selections(path: Path) -> dict[int, dict]:
    selections = json.loads(path.read_text())
    result = {}
    for entry in selections:
        map_id = entry["mapId"]
        if (type(map_id) is not int or not 0 <= map_id <= 999999999
                or entry["coordinateSystem"] != "map-image-pixels"
                or entry["anchor"] != "monster-feet"
                or any(type(entry[key]) is not int or entry[key] < 0 for key in ("x", "y"))
                or entry["region"] != "KMS"
                or type(entry["wzVersion"]) is not int or entry["wzVersion"] <= 0
                or not isinstance(entry["mapName"], str) or not entry["mapName"]
                or map_id in result):
            raise ValueError(f"Invalid/duplicate map selection: {entry}")
        result[map_id] = entry
    return result


def generate_selected(selection: dict) -> dict:
    map_id = selection["mapId"]
    region, version = selection["region"], selection["wzVersion"]
    print(f"Preparing {map_id} ({selection['mapName']}, {region} {version})", flush=True)
    map_url = f"{API}/{region}/{version}/map/{map_id}"
    detail = node(map_url)
    if detail["name"] != selection["mapName"]:
        raise ValueError(f"Map ID/name mismatch: {map_id}")
    padded = str(map_id).zfill(9)
    meta = exported_metadata(f"Map/Map/Map{padded[0]}/{padded}.img", region, version)
    relative = f"{map_id}/foreground.webp"
    # Match the browser preview, including partially missing API render images.
    foreground_method = "wz-sprites"
    foreground = render_map_sprites(meta, detail, region, version)
    if (selection.get("imageWidth", foreground.width), selection.get("imageHeight", foreground.height)) != foreground.size:
        raise ValueError(f"Preview/export image dimensions disagree: {map_id}")
    directory = OUTPUT / str(map_id)
    directory.mkdir(parents=True, exist_ok=True)
    foreground.save(OUTPUT / relative, "WEBP", lossless=True, method=6)
    if selection["x"] >= foreground.width or selection["y"] >= foreground.height:
        raise ValueError(f"Placement outside map image: {map_id}")
    thumbnail = foreground.copy()
    thumbnail.thumbnail((180, 72))
    thumbnail.save(OUTPUT / str(map_id) / "icon.webp", "WEBP", lossless=True)
    mini_map = {key: detail["miniMap"][key] for key in ("centerX", "centerY", "width", "height")}
    for key, value in mini_map.items():
        if find_img_node(meta, f"miniMap/{key}")["value"] != value:
            raise ValueError(f"Map metadata version mismatch: {map_id}/{key}")
    layers = []
    for index, entry in sorted(meta["back"]["children"].items(), key=lambda pair: int(pair[0])):
        props = {key: child["value"] for key, child in entry["children"].items()}
        background_set = props.get("bS")
        if not background_set:
            continue
        section = "ani" if props.get("ani") else "back"
        frame_path = f"{section}/{props['no']}"
        back_path = f"Map/Back/{background_set}.img"
        back_meta = exported_metadata(back_path, region, version)
        frame = find_img_node(back_meta, frame_path)
        if section == "ani":
            first = min((key for key in frame["children"] if key.isdigit()), key=int)
            frame_path += f"/{first}"
            frame = frame["children"][first]
        origin = frame["children"]["origin"]["value"]
        outlink = frame["children"].get("_outlink", {}).get("value")
        image_path = outlink or f"{back_path}/{frame_path}"
        relative_bg = f"{map_id}/background-{index}.webp"
        image = save_image(f"{API}/wz/img/{region}/{version}/{image_path}", relative_bg)
        layers.append({
            "alpha": max(0, min(1, props.get("a", 255) / 255)),
            "flip": bool(props.get("f")), "front": bool(props.get("front")),
            "imagePath": asset_path(relative_bg), "index": int(index),
            "type": props.get("type", 0), "x": props.get("x", 0), "y": props.get("y", 0),
            **{key: props.get(key, 0) for key in ("rx", "ry", "cx", "cy")},
            "sequence": {"animated": False, "loop": False, "frames": [{
                "src": asset_path(relative_bg), "width": image.width, "height": image.height,
                "origin": origin, "delay": 100,
            }]},
        })
        print(f"  background {index}: {image.width}x{image.height}", flush=True)
    first = next((layer for layer in layers if not layer["front"]), None)
    color = (0, 0, 0, 0)
    if first:
        base = Image.open(ROOT / "public" / first["imagePath"]).convert("RGBA")
        color = base.getpixel((base.width // 2, 0))
    label = {"name": detail["name"], "streetName": detail["streetName"]}
    return {
        "id": map_id, **label,
        "labels": {locale: label for locale in ("ko", "en", "ja", "zh-CN", "zh-TW")},
        "source": {"region": region, "wzVersion": version, "foregroundMethod": foreground_method},
        "placement": {key: selection[key] for key in ("coordinateSystem", "anchor", "x", "y")},
        "foregroundPath": asset_path(relative), "iconPath": asset_path(f"{map_id}/icon.webp"),
        "backgroundColor": f"rgb({color[0]}, {color[1]}, {color[2]})" if color[3] else "#282c34",
        "detail": {"id": map_id, **label, "miniMap": mini_map},
        "groundMetrics": {"groundY": ground_y(foreground), "width": foreground.width, "height": foreground.height},
        "backgrounds": layers,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--selections", type=Path, default=SELECTIONS)
    parser.add_argument("--map-ids", nargs="+", type=int)
    args = parser.parse_args()
    selections = read_selections(args.selections)
    selected_ids = args.map_ids if args.map_ids is not None else sorted(set(MAPS) | set(selections))
    unknown = set(selected_ids) - set(MAPS) - set(selections)
    if unknown:
        parser.error(f"Add map selections first: {sorted(unknown)}")
    maps = {entry["id"]: entry for entry in json.loads(MANIFEST.read_text())["maps"]} if MANIFEST.exists() else {}
    for map_id in selected_ids:
        maps[map_id] = generate_selected(selections[map_id]) if map_id in selections else generate(map_id)
    manifest = {"schemaVersion": 1, "region": REGION, "wzVersion": VERSION, "metadataCommit": METADATA_COMMIT, "maps": [maps[key] for key in sorted(maps)]}
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    temporary = MANIFEST.with_suffix(".tmp")
    temporary.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    temporary.replace(MANIFEST)
    print(f"Saved {len(maps)} maps to {MANIFEST.relative_to(ROOT)}", flush=True)


if __name__ == "__main__":
    main()
