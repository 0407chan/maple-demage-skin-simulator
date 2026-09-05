"""Read unencrypted KMS IMG property metadata; Canvas pixel data is skipped.

String blocks follow the MapleStory.io PKG1 WZReader format. This deliberately
rejects encrypted/unknown formats rather than inventing frame origins or delays.
"""

import struct
from typing import Any


class ImgReader:
    def __init__(self, data: bytes):
        self.data = data
        self.position = 0

    def read(self, length: int) -> bytes:
        if length < 0 or self.position + length > len(self.data):
            raise ValueError("IMG property exceeds file bounds")
        result = self.data[self.position:self.position + length]
        self.position += length
        return result

    def unpack(self, format: str) -> Any:
        return struct.unpack("<" + format, self.read(struct.calcsize("<" + format)))[0]

    def integer(self, format: str = "i") -> int:
        value = self.unpack("b")
        return self.unpack(format) if value == -128 else value

    def string(self) -> str:
        length = self.unpack("b")
        if length <= 0:
            length = self.unpack("i") if length == -128 else -length
            return bytes(
                value ^ ((0xAA + index) & 0xFF)
                for index, value in enumerate(self.read(length))
            ).decode("latin1")
        length = self.unpack("i") if length == 127 else length
        encoded = self.read(length * 2)
        decoded = bytearray()
        for index in range(length):
            value = struct.unpack_from("<H", encoded, index * 2)[0]
            decoded.extend(struct.pack("<H", value ^ ((0xAAAA + index) & 0xFFFF)))
        return decoded.decode("utf-16le")

    def string_block(self) -> str:
        marker = self.unpack("B")
        if marker in (0, 0x73):
            return self.string()
        if marker in (1, 0x1B):
            offset = self.unpack("i")
            if not 0 <= offset < len(self.data):
                raise ValueError("Invalid IMG string offset")
            saved = self.position
            self.position = offset
            result = self.string()
            self.position = saved
            return result
        raise ValueError(f"Unsupported IMG string block: {marker}")

    def properties(self) -> dict[str, Any]:
        self.read(2)
        count = self.integer()
        if count < 0:
            raise ValueError("Invalid IMG property count")
        properties: dict[str, Any] = {}
        for _ in range(count):
            name = self.string_block()
            kind = self.unpack("B")
            value = None
            children = {}
            if kind == 0:
                pass
            elif kind in (2, 11):
                value = self.unpack("h")
            elif kind == 18:
                value = self.unpack("H")
            elif kind in (3, 19):
                value = self.integer()
            elif kind == 20:
                value = self.integer("q")
            elif kind == 4:
                value = self.unpack("f") if self.unpack("B") == 128 else 0
            elif kind == 5:
                value = self.unpack("d")
            elif kind == 8:
                value = self.string_block()
            elif kind == 9:
                length = self.unpack("I")
                end = self.position + length
                if end > len(self.data):
                    raise ValueError("IMG extended property exceeds file bounds")
                kind = self.string_block()
                if kind == "Property":
                    children = self.properties()
                elif kind == "Canvas":
                    self.read(1)
                    if self.unpack("B"):
                        children = self.properties()
                elif kind == "Shape2D#Vector2D":
                    value = {"x": self.integer(), "y": self.integer()}
                elif kind == "UOL":
                    self.read(1)
                    value = self.string_block()
                else:
                    raise ValueError(f"Unsupported IMG extended property: {kind}")
                if self.position > end:
                    raise ValueError("IMG extended property length mismatch")
                self.position = end
            else:
                raise ValueError(f"Unsupported IMG property: {kind} ({name})")
            properties[name] = {"type": kind, "value": value, "children": children}
        return properties


def read_img_metadata(data: bytes) -> dict[str, Any]:
    reader = ImgReader(data)
    if reader.string_block() != "Property":
        raise ValueError("Expected an unencrypted KMS Property IMG")
    result = reader.properties()
    if reader.position != len(data):
        raise ValueError("Unexpected trailing IMG data")
    return result


def find_img_node(root: dict[str, Any], path: str) -> dict[str, Any]:
    node = {"children": root}
    for part in path.split("/"):
        node = node["children"][part]
    return node
