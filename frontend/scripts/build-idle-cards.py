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

Usage (requires Pillow):  python scripts/build-idle-cards.py
Re-run it whenever an image in public/event is replaced.
"""

from pathlib import Path

from PIL import Image, ImageDraw

EVENT_DIR = Path(__file__).resolve().parent.parent / "public" / "event"
OUT_DIR = EVENT_DIR / "cards"

CARDS = [
    # (source, output, has its own frame)
    ("menu.png", "menu.webp", False),
    ("btcombo.png", "combos.webp", True),
    ("bt lemon.png", "lemonades.webp", True),
    ("tbebida.png", "bebidas.webp", True),
]

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


def build(source: Path, framed: bool) -> Image.Image:
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

    radius = round(height * RADIUS)
    mask = Image.new("L", card.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, OUT_WIDTH - 1, height - 1), radius, fill=255)
    card.putalpha(mask)
    ImageDraw.Draw(card).rounded_rectangle(
        (0, 0, OUT_WIDTH - 1, height - 1), radius, outline=FRAME_COLOR, width=FRAME_WIDTH
    )
    return card


def main() -> None:
    OUT_DIR.mkdir(exist_ok=True)
    for source, output, framed in CARDS:
        card = build(EVENT_DIR / source, framed)
        card.save(OUT_DIR / output, "WEBP", quality=88, method=6)
        print(f"{source} -> cards/{output} {card.size}")


if __name__ == "__main__":
    main()
