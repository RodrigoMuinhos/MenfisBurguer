"""Build the kiosk idle-screen cards from the event art.

The source art comes in different aspect ratios, some with their own pink
frame (btcombo, bt lemon, tbebida) and one transparent without a frame
(menu). This script normalizes them so every button on the idle screen has
the exact same size and frame:

  1. framed art is cropped just inside its own frame;
  2. narrower art is widened by repeating its edge columns (the card
     backgrounds are flat at the sides, so no seam shows);
  3. transparent art is centered on the card background;
  4. every card gets the same rounded pink frame and is saved as WebP.

It also builds a square version of each card for landscape screens (2x2
grid): the card's title block on top and its product photo below, both taken
from the wide card (SQUARE_REGIONS) and blended into the card background.

Usage (requires Pillow):  python scripts/build-idle-cards.py
Re-run it whenever an image in public/event is replaced.
"""

from pathlib import Path

from PIL import Image, ImageDraw

EVENT_DIR = Path(__file__).resolve().parent.parent / "public" / "event"
OUT_DIR = EVENT_DIR / "cards"

CARDS = [
    # (source, output name, has its own frame)
    ("menu.png", "menu", False),
    ("btcombo.png", "combos", True),
    ("bt lemon.png", "lemonades", True),
    ("tbebida.png", "bebidas", True),
]

# Boxes in wide-card pixels (1800 x 608), arrows left out: the title block,
# the product photo, and areas (rectangles or polygons) to blank out of each
# one where title and photo overlap in the original art. Re-check these when an image is replaced.
SQUARE_REGIONS = {
    "menu": {
        "title": (60, 70, 740, 510),
        "title_erase": [
            [(733, 140), (760, 140), (760, 608), (600, 608), (600, 460),
             (680, 420), (690, 350), (720, 330), (733, 240)],
        ],
        "photo": (690, 10, 1530, 600),
        "photo_erase": [[(680, 60), (736, 60), (736, 240), (706, 345), (680, 345)]],
    },
    "combos": {
        "title": (50, 80, 735, 570),
        "title_erase": [(690, 370, 760, 608)],
        "photo": (750, 10, 1580, 600),
    },
    "lemonades": {
        "title": (170, 110, 890, 470),
        "title_erase": [(700, 362, 900, 608)],
        "photo": (640, 20, 1460, 600),
        "photo_erase": [(600, 0, 700, 450), (700, 0, 900, 358)],
    },
    "bebidas": {
        "title": (180, 110, 800, 545),
        "title_erase": [(720, 478, 800, 608)],
        "photo": (790, 10, 1500, 600),
    },
}
SQUARE_SIZE = 1000
FEATHER = 36

OUT_WIDTH = 1800
ASPECT = 2.96  # the widest card (Combos) once its frame is cropped
FRAME_INSET = 0.012  # share of the source width taken by its frame
CARD_BG = (250, 245, 241, 255)
FRAME_COLOR = (247, 122, 148, 255)
FRAME_WIDTH = 9
RADIUS = 0.12  # share of the card height


def widen(image: Image.Image, width: int) -> Image.Image:
    """Pad left/right to `width` by repeating the outermost columns."""
    pad = width - image.width
    if pad <= 0:
        return image
    left, right = pad // 2, pad - pad // 2
    out = Image.new("RGBA", (width, image.height))
    out.paste(image, (left, 0))
    if left:
        out.paste(image.crop((0, 0, 1, image.height)).resize((left, image.height)), (0, 0))
    if right:
        out.paste(
            image.crop((image.width - 1, 0, image.width, image.height)).resize((right, image.height)),
            (left + image.width, 0),
        )
    return out


def build_art(source: Path, framed: bool) -> Image.Image:
    """The wide card without its rounded frame."""
    height = round(OUT_WIDTH / ASPECT)
    art = Image.open(source).convert("RGBA")
    card = Image.new("RGBA", (OUT_WIDTH, height), CARD_BG)

    if framed:
        inset = round(art.width * FRAME_INSET)
        art = art.crop((inset, inset, art.width - inset, art.height - inset))
        art = art.resize((round(art.width * height / art.height), height), Image.LANCZOS)
        if art.width > OUT_WIDTH:
            art = art.resize((OUT_WIDTH, round(art.height * OUT_WIDTH / art.width)), Image.LANCZOS)
        art = widen(art, OUT_WIDTH)
        card.alpha_composite(art, (0, (height - art.height) // 2))
    else:
        art = art.crop(art.getbbox())
        scale = min(OUT_WIDTH * 0.94 / art.width, height * 0.94 / art.height)
        art = art.resize((round(art.width * scale), round(art.height * scale)), Image.LANCZOS)
        card.alpha_composite(art, ((OUT_WIDTH - art.width) // 2, (height - art.height) // 2))
    return card


def frame(card: Image.Image) -> Image.Image:
    """Clip to the shared rounded shape and draw the shared pink border."""
    width, height = card.size
    radius = round(min(width, height) * RADIUS)
    mask = Image.new("L", card.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, width - 1, height - 1), radius, fill=255)
    card = card.copy()
    card.putalpha(mask)
    ImageDraw.Draw(card).rounded_rectangle(
        (0, 0, width - 1, height - 1), radius, outline=FRAME_COLOR, width=FRAME_WIDTH
    )
    return card


def feathered(region: Image.Image) -> Image.Image:
    """Fade the region's edges out so it blends into the card background."""
    width, height = region.size
    mask = Image.new("L", region.size, 0)
    draw = ImageDraw.Draw(mask)
    for step in range(FEATHER):
        value = round(255 * (step + 1) / FEATHER)
        draw.rectangle((step, step, width - 1 - step, height - 1 - step), fill=value)
    region = region.copy()
    alpha = region.getchannel("A")
    region.putalpha(Image.composite(alpha, Image.new("L", region.size, 0), mask))
    return region


def fit(region: Image.Image, max_width: int, max_height: int) -> Image.Image:
    scale = min(max_width / region.width, max_height / region.height)
    return region.resize((round(region.width * scale), round(region.height * scale)), Image.LANCZOS)


def region(art: Image.Image, box, erase) -> Image.Image:
    art = art.copy()
    for area in erase:
        if len(area) == 4 and not isinstance(area[0], tuple):
            ImageDraw.Draw(art).rectangle(area, fill=CARD_BG)
        else:
            ImageDraw.Draw(art).polygon(area, fill=CARD_BG)
    return feathered(art.crop(box))


def build_square(art: Image.Image, regions: dict) -> Image.Image:
    size = SQUARE_SIZE
    margin = round(size * 0.06)
    card = Image.new("RGBA", (size, size), CARD_BG)
    title = fit(
        region(art, regions["title"], regions.get("title_erase", [])),
        size - 2 * margin,
        round(size * 0.40),
    )
    photo = fit(
        region(art, regions["photo"], regions.get("photo_erase", [])),
        size - 2 * margin,
        size - 2 * margin - title.height,
    )
    top = (size - title.height - photo.height) // 2
    card.alpha_composite(title, ((size - title.width) // 2, top))
    card.alpha_composite(photo, ((size - photo.width) // 2, top + title.height))
    return card


def save(card: Image.Image, name: str) -> None:
    card.save(OUT_DIR / name, "WEBP", quality=88, method=6)
    print(f"cards/{name} {card.size}")


def main() -> None:
    OUT_DIR.mkdir(exist_ok=True)
    for source, name, framed in CARDS:
        art = build_art(EVENT_DIR / source, framed)
        save(frame(art), f"{name}.webp")
        save(frame(build_square(art, SQUARE_REGIONS[name])), f"{name}-square.webp")


if __name__ == "__main__":
    main()
