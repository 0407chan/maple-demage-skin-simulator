#!/usr/bin/env python3
"""Generate local APNG assets for the currently mapped action damage skins."""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from concurrent.futures import Future, ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Optional

try:
    from PIL import Image
except ImportError as error:
    raise SystemExit(
        "Pillow가 필요합니다. "
        "python3 -m pip install -r scripts/requirements-action-skins.txt"
    ) from error


ROOT = Path(__file__).resolve().parents[1]
SKIN_MAP_PATH = ROOT / "src/constants/damageSkinMapper.ts"
MANIFEST_PATH = ROOT / "src/generated/actionDamageSkinManifest.json"
CACHE_DIR = ROOT / ".cache/action-skins"
OUTPUT_ROOT = ROOT / "public/generated/damage-skins"
USER_AGENT = "maple-damage-skin-simulator-action-asset-generator/1.0"

NODE_PATHS = [
    *(f"{skin_type}/{digit}" for skin_type in ("NoCri0", "NoCri1", "NoRed0", "NoRed1") for digit in range(10)),
    "NoCri1/effect3",
    "NoCustom/NoCri1/3",
    "NoCustom/NoCri1/4",
    "NoCustom/NoRed1/3",
    "NoCustom/NoRed1/4",
]
UNIT_ZERO_NODE_PATHS = [
    "NoCustom/NoCri0/3",
    "NoCustom/NoCri0/4",
    "NoCustom/NoRed0/3",
    "NoCustom/NoRed0/4",
]


@dataclass(frozen=True)
class ActionSkin:
    index: int
    item_ids: tuple[int, ...]
    names: tuple[str, ...]


@dataclass(frozen=True)
class ExportedNode:
    skin: ActionSkin
    node_path: str
    frames: tuple[tuple[int, bytes], ...]
    static_image: Optional[bytes] = None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--region", default="KMS")
    parser.add_argument("--version", type=int, required=True)
    parser.add_argument("--workers", type=int, default=24)
    parser.add_argument(
        "--indices",
        type=int,
        nargs="*",
        help="자동 감지 대신 생성할 DamageSkin 인덱스",
    )
    return parser.parse_args()


def cache_path(url: str, suffix: str) -> Path:
    digest = hashlib.sha256(url.encode("utf-8")).hexdigest()
    return CACHE_DIR / f"{digest}{suffix}"


def fetch_bytes(url: str, suffix: str, attempts: int = 5) -> bytes:
    path = cache_path(url, suffix)
    if path.exists():
        return path.read_bytes()

    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    last_error: Optional[Exception] = None
    for attempt in range(attempts):
        try:
            with urllib.request.urlopen(request, timeout=90) as response:
                if response.status == 202:
                    raise RuntimeError("MapleStory.io가 데이터를 준비 중입니다.")
                payload = response.read()
            path.parent.mkdir(parents=True, exist_ok=True)
            temporary_path = path.with_name(f"{path.name}.{time.time_ns()}.tmp")
            temporary_path.write_bytes(payload)
            temporary_path.replace(path)
            return payload
        except (OSError, RuntimeError, urllib.error.HTTPError) as error:
            last_error = error
            if isinstance(error, urllib.error.HTTPError) and error.code == 404:
                raise
            if attempt + 1 < attempts:
                time.sleep(min(8, 1.5**attempt))

    raise RuntimeError(f"요청 실패: {url}") from last_error


def fetch_json(url: str) -> dict[str, Any]:
    payload = fetch_bytes(url, ".json")
    data = json.loads(payload)
    if not isinstance(data, dict):
        raise RuntimeError(f"JSON 객체가 아닌 응답: {url}")
    return data


def fetch_optional_json(url: str) -> Optional[dict[str, Any]]:
    try:
        return fetch_json(url)
    except urllib.error.HTTPError as error:
        if error.code == 404:
            return None
        raise


def read_skin_map() -> dict[int, tuple[int, ...]]:
    result: dict[int, tuple[int, ...]] = {}
    entry_pattern = re.compile(r"^\s*(\d+):\s*\[([^\]]+)\]", re.MULTILINE)
    for match in entry_pattern.finditer(SKIN_MAP_PATH.read_text(encoding="utf-8")):
        item_id = int(match.group(1))
        indices = tuple(int(value) for value in re.findall(r"\d+", match.group(2)))
        if indices:
            result[item_id] = indices
    return result


def discover_action_skins(region: str, version: int) -> list[ActionSkin]:
    query = urllib.parse.urlencode({"searchFor": "데미지 스킨"})
    url = f"https://maplestory.io/api/{region}/{version}/item?{query}"
    items = json.loads(fetch_bytes(url, ".items.json"))
    if not isinstance(items, list):
        raise RuntimeError("아이템 목록 응답 형식이 올바르지 않습니다.")

    skin_map = read_skin_map()
    grouped: dict[int, dict[str, set[Any]]] = {}
    for item in items:
        if not isinstance(item, dict):
            continue
        item_id = item.get("id")
        name = item.get("name")
        if (
            not isinstance(item_id, int)
            or not isinstance(name, str)
            or "액션 데미지 스킨" not in name
            or item_id not in skin_map
        ):
            continue
        for index in skin_map[item_id]:
            entry = grouped.setdefault(index, {"item_ids": set(), "names": set()})
            entry["item_ids"].add(item_id)
            entry["names"].add(name)

    return [
        ActionSkin(
            index=index,
            item_ids=tuple(sorted(entry["item_ids"])),
            names=tuple(sorted(entry["names"])),
        )
        for index, entry in sorted(grouped.items())
    ]


def read_nodes_from_archive(
    skin: ActionSkin,
    archive_bytes: bytes,
    prefix: str,
    node_paths: list[str] = NODE_PATHS,
) -> list[ExportedNode]:
    nodes: list[ExportedNode] = []

    with zipfile.ZipFile(io.BytesIO(archive_bytes)) as archive:
        names = set(archive.namelist())
        for node_path in node_paths:
            flattened = node_path.replace("/", "-")
            static_name = f"{prefix}{flattened}.png"
            frame_pattern = re.compile(
                rf"^{re.escape(prefix + flattened)}-(\d+)\.png$"
            )
            frames = tuple(
                sorted(
                    (
                        (int(match.group(1)), archive.read(name))
                        for name in names
                        if (match := frame_pattern.match(name))
                    ),
                    key=lambda entry: entry[0],
                )
            )

            if frames:
                nodes.append(ExportedNode(skin, node_path, frames))
            elif static_name in names:
                nodes.append(
                    ExportedNode(
                        skin,
                        node_path,
                        (),
                        static_image=archive.read(static_name),
                    )
                )

    return nodes


def read_exported_nodes(
    skin: ActionSkin, region: str, version: int
) -> list[ExportedNode]:
    export_base = f"https://maplestory.io/api/wz/export/{region}/{version}/Effect"
    standard_archive = fetch_bytes(
        f"{export_base}/DamageSkin.img/{skin.index}", ".zip"
    )
    nodes = read_nodes_from_archive(
        skin,
        standard_archive,
        f"Effect-DamageSkin.img-{skin.index}-",
    )

    # 일부 액션 스킨은 본체에 _outlink만 있고 실제 Canvas는 별도 IMG에 있다.
    if len(nodes) < len(NODE_PATHS):
        try:
            canvas_archive = fetch_bytes(
                f"{export_base}/_Canvas/DamageSkin.img/{skin.index}",
                ".canvas.zip",
            )
        except urllib.error.HTTPError as error:
            if error.code != 404:
                raise
        else:
            canvas_nodes = read_nodes_from_archive(
                skin,
                canvas_archive,
                f"Effect-_Canvas-DamageSkin.img-{skin.index}-",
                NODE_PATHS + UNIT_ZERO_NODE_PATHS,
            )
            existing_paths = {node.node_path for node in nodes}
            nodes.extend(
                node for node in canvas_nodes if node.node_path not in existing_paths
            )

            # 구형 유닛 액션 스킨의 1형 노드는 _Canvas의 0형 이미지를 참조한다.
            canvas_by_path = {node.node_path: node for node in canvas_nodes}
            existing_paths = {node.node_path for node in nodes}
            for target_path in NODE_PATHS:
                if target_path in existing_paths or not target_path.startswith(
                    "NoCustom/"
                ):
                    continue
                source_path = re.sub(r"^(NoCustom/No(?:Cri|Red))1/", r"\g<1>0/", target_path)
                source_node = canvas_by_path.get(source_path)
                if source_node:
                    nodes.append(
                        ExportedNode(
                            skin,
                            target_path,
                            source_node.frames,
                            source_node.static_image,
                        )
                    )

            nodes = [node for node in nodes if node.node_path in NODE_PATHS]

    return nodes


def metadata_url(
    region: str,
    version: int,
    node: ExportedNode,
    child: str,
    frame: Optional[int] = None,
) -> str:
    base = (
        f"https://maplestory.io/api/wz/{region}/{version}/Effect/"
        f"DamageSkin.img/{node.skin.index}/{node.node_path}"
    )
    if frame is not None:
        base = f"{base}/{frame}"
    return f"{base}/{child}"


def read_point(node: Optional[dict[str, Any]]) -> tuple[int, int]:
    value = node.get("value") if node else None
    if not isinstance(value, dict):
        return (0, 0)
    x = value.get("x", 0)
    y = value.get("y", 0)
    return (
        int(x) if isinstance(x, (int, float)) else 0,
        int(y) if isinstance(y, (int, float)) else 0,
    )


def read_delay(node: Optional[dict[str, Any]]) -> int:
    value = node.get("value") if node else None
    return max(1, int(value)) if isinstance(value, (int, float)) else 100


def collect_metadata(
    nodes: list[ExportedNode], region: str, version: int, workers: int
) -> dict[str, Optional[dict[str, Any]]]:
    urls: set[str] = set()
    for node in nodes:
        if node.static_image is not None:
            urls.add(metadata_url(region, version, node, "origin"))
            continue
        for frame_number, _ in node.frames:
            urls.add(metadata_url(region, version, node, "origin", frame_number))
            urls.add(metadata_url(region, version, node, "delay", frame_number))

    results: dict[str, Optional[dict[str, Any]]] = {}
    print(f"[metadata] {len(urls)}개 요청 (캐시 재사용 가능)", flush=True)
    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures: dict[Future[Optional[dict[str, Any]]], str] = {
            executor.submit(fetch_optional_json, url): url for url in sorted(urls)
        }
        for completed, future in enumerate(as_completed(futures), start=1):
            url = futures[future]
            try:
                results[url] = future.result()
            except Exception as error:
                raise RuntimeError(f"메타데이터 요청 실패: {url}") from error
            if completed % 100 == 0 or completed == len(futures):
                print(f"[metadata] {completed}/{len(futures)}", flush=True)
    return results


def create_asset(
    node: ExportedNode,
    region: str,
    version: int,
    metadata: dict[str, Optional[dict[str, Any]]],
) -> tuple[str, dict[str, Any]]:
    output_directory = OUTPUT_ROOT / region / str(version) / str(node.skin.index)
    output_path = output_directory / f"{node.node_path}.png"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    public_path = output_path.relative_to(ROOT / "public").as_posix()
    key = f"{region}/{version}/{node.skin.index}/{node.node_path}"

    if node.static_image is not None:
        with Image.open(io.BytesIO(node.static_image)) as source:
            image = source.convert("RGBA")
        origin = read_point(
            metadata.get(metadata_url(region, version, node, "origin"))
        )
        image.save(output_path, format="PNG", optimize=True)
        return key, {
            "path": public_path,
            "width": image.width,
            "height": image.height,
            "origin": {"x": origin[0], "y": origin[1]},
            "animated": False,
            "frameCount": 1,
        }

    images: list[Image.Image] = []
    origins: list[tuple[int, int]] = []
    delays: list[int] = []
    for frame_number, image_bytes in node.frames:
        with Image.open(io.BytesIO(image_bytes)) as source:
            images.append(source.convert("RGBA"))
        origins.append(
            read_point(
                metadata.get(
                    metadata_url(region, version, node, "origin", frame_number)
                )
            )
        )
        delays.append(
            read_delay(
                metadata.get(
                    metadata_url(region, version, node, "delay", frame_number)
                )
            )
        )

    left = min(-origin[0] for origin in origins)
    top = min(-origin[1] for origin in origins)
    right = max(image.width - origin[0] for image, origin in zip(images, origins))
    bottom = max(image.height - origin[1] for image, origin in zip(images, origins))
    width = max(1, right - left)
    height = max(1, bottom - top)
    canvases: list[Image.Image] = []
    for image, origin in zip(images, origins):
        canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        canvas.alpha_composite(image, (-origin[0] - left, -origin[1] - top))
        canvases.append(canvas)

    if len(canvases) == 1:
        canvases[0].save(output_path, format="PNG", optimize=True)
    else:
        canvases[0].save(
            output_path,
            format="PNG",
            save_all=True,
            append_images=canvases[1:],
            duration=delays,
            loop=0,
            disposal=[0] * len(canvases),
            blend=[0] * len(canvases),
            compress_level=9,
        )

    # Pillow는 동일한 연속 프레임을 duration에 합쳐 저장할 수 있다.
    with Image.open(output_path) as rendered:
        actual_frame_count = getattr(rendered, "n_frames", 1)
        animated = bool(getattr(rendered, "is_animated", False))
        actual_duration = 0
        for frame_index in range(actual_frame_count):
            rendered.seek(frame_index)
            actual_duration += int(rendered.info.get("duration", 0))

    return key, {
        "path": public_path,
        "width": width,
        "height": height,
        "origin": {"x": -left, "y": -top},
        "animated": animated,
        "frameCount": actual_frame_count,
        "duration": actual_duration or sum(delays),
    }


def main() -> int:
    args = parse_args()
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    action_skins = discover_action_skins(args.region, args.version)
    if args.indices:
        selected = set(args.indices)
        discovered = {skin.index: skin for skin in action_skins}
        action_skins = [
            discovered.get(index, ActionSkin(index, (), ()))
            for index in sorted(selected)
        ]

    if not action_skins:
        raise SystemExit("현재 SkinMap에서 액션 데미지 스킨을 찾지 못했습니다.")

    print(
        "[skins] "
        + ", ".join(
            f"{skin.index}({skin.names[0] if skin.names else '수동 지정'})"
            for skin in action_skins
        ),
        flush=True,
    )

    nodes: list[ExportedNode] = []
    with ThreadPoolExecutor(max_workers=min(4, len(action_skins))) as executor:
        futures = {
            executor.submit(
                read_exported_nodes, skin, args.region, args.version
            ): skin
            for skin in action_skins
        }
        for future in as_completed(futures):
            skin = futures[future]
            exported = future.result()
            nodes.extend(exported)
            print(f"[export] {skin.index}: {len(exported)}개 노드", flush=True)

    metadata = collect_metadata(nodes, args.region, args.version, args.workers)
    assets: dict[str, dict[str, Any]] = {}
    for completed, node in enumerate(nodes, start=1):
        key, asset = create_asset(node, args.region, args.version, metadata)
        assets[key] = asset
        if completed % 25 == 0 or completed == len(nodes):
            print(f"[assets] {completed}/{len(nodes)}", flush=True)

    manifest = {
        "schemaVersion": 1,
        "region": args.region,
        "wzVersion": args.version,
        "skins": [
            {
                "index": skin.index,
                "itemIds": list(skin.item_ids),
                "names": list(skin.names),
            }
            for skin in action_skins
        ],
        "assets": dict(sorted(assets.items())),
    }
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    total_bytes = sum(
        (ROOT / "public" / asset["path"]).stat().st_size
        for asset in assets.values()
    )
    print(
        f"[done] {len(action_skins)}개 스킨, {len(assets)}개 파일, "
        f"{total_bytes / 1024 / 1024:.2f} MiB",
        flush=True,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
