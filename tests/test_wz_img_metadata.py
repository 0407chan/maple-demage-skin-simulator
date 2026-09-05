import struct
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from wz_img_metadata import ImgReader, find_img_node, read_img_metadata


def string(text):
    data = text.encode("ascii")
    return struct.pack("b", -len(data)) + bytes(
        value ^ ((0xAA + i) & 255) for i, value in enumerate(data)
    )


def properties(entries):
    return b"\0\0" + struct.pack("b", len(entries)) + b"".join(
        b"\0" + string(name) + payload for name, payload in entries
    )


def extended(kind, payload):
    data = b"\0" + string(kind) + payload
    return b"\x09" + struct.pack("<I", len(data)) + data


class ImgMetadataTests(unittest.TestCase):
    def test_canvas_origin_delay_and_unsigned_loop(self):
        # Canvas pixels are opaque to the metadata reader and must be skipped.
        frame = extended("Canvas", b"\0\1" + properties([
            ("origin", extended("Shape2D#Vector2D", struct.pack("bb", -7, 42))),
            ("delay", b"\x03\x80" + struct.pack("<i", 180)),
        ]) + b"opaque canvas data")
        data = b"\x73" + string("Property") + properties([
            ("0", frame), ("loop", b"\x12\xff\xff")
        ])
        root = read_img_metadata(data)
        self.assertEqual(find_img_node(root, "0/origin")["value"], {"x": -7, "y": 42})
        self.assertEqual(find_img_node(root, "0/delay")["value"], 180)
        self.assertEqual(root["loop"]["value"], 65535)
        with self.assertRaises(KeyError):
            find_img_node(root, "0/missing")

    def test_shared_string_restores_cursor(self):
        shared = string("origin")
        reader = ImgReader(shared + b"\x01" + struct.pack("<i", 0))
        reader.position = len(shared)
        self.assertEqual(reader.string_block(), "origin")
        self.assertEqual(reader.position, len(reader.data))

    def test_unicode_string(self):
        text = "유닛"
        encoded = b"".join(struct.pack("<H", ord(c) ^ (0xAAAA + i)) for i, c in enumerate(text))
        self.assertEqual(ImgReader(bytes([len(text)]) + encoded).string(), text)

    def test_truncated_or_unknown_files_fail(self):
        valid = b"\x73" + string("Property") + properties([])
        for data in (valid[:-1], valid + b"extra", b"\x73" + string("Encrypted")):
            with self.assertRaises((ValueError, UnicodeError)):
                read_img_metadata(data)


if __name__ == "__main__":
    unittest.main()
