"""Normalize an image-generated 5x4 helmet sheet onto exact game pixels.

The source may have uneven cell boundaries and inconsistent outer padding.  The
runtime must never compensate for that with per-item magic offsets, so this
build step maps every source cell to a 48x48 cell with one shared head socket.
"""

from pathlib import Path
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "sprites" / "helmet-directional-atlas-v2.png"
OUTPUT = ROOT / "assets" / "sprites" / "helmet-directional-atlas-v3.png"
COLUMNS, ROWS = 5, 4
CELL = 48
SOURCE_TO_GAME_SCALE = 0.17
TARGET_SOCKET_X = 24
TARGET_NECK_BASELINE_Y = 43


def edge(index: int, count: int, extent: int) -> int:
    return round(index * extent / count)


def main() -> None:
    source = Image.open(SOURCE).convert("RGBA")
    atlas = Image.new("RGBA", (COLUMNS * CELL, ROWS * CELL), (0, 0, 0, 0))

    for row in range(ROWS):
        for column in range(COLUMNS):
            x0, x1 = edge(column, COLUMNS, source.width), edge(column + 1, COLUMNS, source.width)
            y0, y1 = edge(row, ROWS, source.height), edge(row + 1, ROWS, source.height)
            cell = source.crop((x0, y0, x1, y1))
            bounds = cell.getchannel("A").getbbox()
            if not bounds:
                raise RuntimeError(f"empty helmet cell at {column},{row}")

            sprite = cell.crop(bounds)
            width = max(1, round(sprite.width * SOURCE_TO_GAME_SCALE))
            height = max(1, round(sprite.height * SOURCE_TO_GAME_SCALE))
            sprite = sprite.resize((width, height), Image.Resampling.NEAREST)

            # The image-generation prompt fixes the head socket at the center
            # of each source cell.  Preserve that pivot instead of centering
            # the varying horn/visor silhouette bounding boxes.
            source_socket_x = cell.width / 2
            paste_x = round(TARGET_SOCKET_X + (bounds[0] - source_socket_x) * SOURCE_TO_GAME_SCALE)
            paste_y = TARGET_NECK_BASELINE_Y - height
            atlas.alpha_composite(sprite, (column * CELL + paste_x, row * CELL + paste_y))

    atlas.save(OUTPUT, optimize=True)
    print(f"Wrote {OUTPUT} ({atlas.width}x{atlas.height})")


if __name__ == "__main__":
    main()
