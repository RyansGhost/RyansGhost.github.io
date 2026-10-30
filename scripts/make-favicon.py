"""Draw the site's favicon, a scowling 16x16 pixel ghost in the theme's
green and blue, and write every favicon file into static/.

Run from the repository root:  python3 scripts/make-favicon.py
Needs Pillow. Edit GHOST or COLOURS below, then run it again.
"""
from PIL import Image

# One character per pixel. "." is the dark background.
GHOST = """\
................
......GGGG......
....GGGGGGGG....
...GGGGGGGGGG...
..GGGGGGGGGGGG..
..GKKGGGGGGKKG..
..GGKKKGGKKKGG..
..GGKAKGGKAKGG..
..GGGKKGGKKGGG..
..GKWKWKKWKWKG..
..BKKKKKKKKKKB..
..BBBKWKKWKBBB..
..BBBBBBBBBBBB..
..BB.BBB.BB.BB..
..B...B...B..B..
................"""

# Colours from risotto's base16-dark palette, the one the site uses
COLOURS = {
    ".": "#181818",  # --bg
    "G": "#a1b56c",  # --logo (green)
    "B": "#7cafc2",  # --link (blue)
    "K": "#181818",  # eye sockets, brows and mouth
    "A": "#f7ca88",  # --highlight (glowing eyes)
    "W": "#d8d8d8",  # --fg (fangs)
}

ROWS = GHOST.splitlines()
SIZE = len(ROWS)
assert all(len(row) == SIZE for row in ROWS), "GHOST must be square"


def rgb(hex_colour):
    return tuple(int(hex_colour[i:i + 2], 16) for i in (1, 3, 5))


def sprite(radius):
    """The ghost at 1px per pixel, on a dark tile with rounded corners
    (radius in sprite pixels; the corner pixels are left transparent)."""
    image = Image.new("RGBA", (SIZE, SIZE))
    for y, row in enumerate(ROWS):
        for x, char in enumerate(row):
            dx = max(radius - x, x - (SIZE - 1 - radius), 0)
            dy = max(radius - y, y - (SIZE - 1 - radius), 0)
            corner = dx and dy and (dx - 0.5) ** 2 + (dy - 0.5) ** 2 > radius ** 2
            image.putpixel((x, y), (0, 0, 0, 0) if corner else rgb(COLOURS[char]) + (255,))
    return image


def scaled(scale, pad=0, radius=2):
    """The sprite scaled up by a whole number, so pixels stay sharp, with
    optional padding in background colour (for the opaque Apple icon)."""
    image = sprite(radius if not pad else 0).resize((SIZE * scale,) * 2, Image.NEAREST)
    if not pad:
        return image
    tile = Image.new("RGBA", (SIZE * scale + 2 * pad,) * 2, rgb(COLOURS["."]) + (255,))
    tile.paste(image, (pad, pad))
    return tile


def svg():
    """The same pixels as an SVG, one rect per horizontal run of colour."""
    rects = []
    for y, row in enumerate(ROWS):
        x = 0
        while x < SIZE:
            char = row[x]
            end = x
            while end < SIZE and row[end] == char:
                end += 1
            if char != ".":
                rects.append(f'<rect x="{x}" y="{y}" width="{end - x}" height="1" fill="{COLOURS[char]}"/>')
            x = end
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}" shape-rendering="crispEdges">\n'
        f'<rect width="{SIZE}" height="{SIZE}" rx="2.5" fill="{COLOURS["."]}"/>\n'
        + "\n".join(rects) + "\n</svg>\n"
    )


scaled(1).save("static/favicon-16x16.png", optimize=True)
scaled(2).save("static/favicon-32x32.png", optimize=True)
scaled(10, pad=10).convert("RGB").save("static/apple-touch-icon.png", optimize=True)  # 180x180
scaled(3).save("static/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)],
               append_images=[scaled(1), scaled(2)])
with open("static/favicon.svg", "w") as f:
    f.write(svg())
print("Wrote static/favicon.ico, favicon.svg, favicon-16x16.png, favicon-32x32.png and apple-touch-icon.png")
