"""Reads an image from stdin and writes a white-background JPEG to stdout."""
import io
import sys

from PIL import Image, ImageFilter
from rembg import new_session, remove


def main() -> None:
    source = Image.open(io.BytesIO(sys.stdin.buffer.read())).convert("RGBA")
    # The portrait model is much smaller than the default model, so the first
    # preview is available promptly while still segmenting people accurately.
    foreground = remove(
        source,
        session=new_session("u2netp"),
        alpha_matting=True,
        alpha_matting_foreground_threshold=240,
        alpha_matting_background_threshold=10,
        alpha_matting_erode_size=8,
    )
    # A slight feather removes the hard, dark edge that can otherwise remain
    # when a photo taken against a dark or colourful background is composited
    # onto white.
    alpha = foreground.getchannel("A").filter(ImageFilter.GaussianBlur(radius=0.7))
    foreground.putalpha(alpha)
    white_background = Image.new("RGBA", foreground.size, "white")
    white_background.alpha_composite(foreground)

    output = io.BytesIO()
    white_background.convert("RGB").save(output, format="JPEG", quality=95)
    sys.stdout.buffer.write(output.getvalue())


if __name__ == "__main__":
    main()
