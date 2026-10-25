"""Turns the raw files in assets/ into web assets: trimmed square logos (public/logos) and
web-sized certificate images rendered from the PDFs (public/certs). Run: python -I scripts/prepare-assets.py"""
import io
import os
import sys

import fitz
from PIL import Image, ImageChops

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets')
LOGOS = os.path.join(ROOT, 'public', 'logos')
CERTS = os.path.join(ROOT, 'public', 'certs')


def trim(im, pad=10):
    """Crops the white margin around a logo, then re-centres it on a square white tile."""
    bg = Image.new('RGB', im.size, (255, 255, 255))
    diff = ImageChops.difference(im, bg).convert('L').point(lambda v: 255 if v > 18 else 0)
    im = im.crop(diff.getbbox())
    w, h = im.size
    s = max(w, h) + pad * 2
    out = Image.new('RGB', (s, s), (255, 255, 255))
    out.paste(im, ((s - w) // 2, (s - h) // 2))
    return out


LOGO_FILES = [
    ('1631301755323.jpg', 'open-innovation-lab', True),
    ('mtas_solutions_private_limited_logo.jpg', 'mtas', True),
    ('rising_academy_network_logo.jpg', 'rising-academic-network', True),
    ('vanyarcom_logo.jpg', 'vanyar', False),  # already a full-bleed square
]

CERT_FILES = [
    ('AI Engineer', 'ai-engineer'),
    ('Data Engineer', 'data-engineer'),
    ('Application Developer', 'application-developer'),
    ('Aware', 'foundry-aware'),
]


def main():
    os.makedirs(LOGOS, exist_ok=True)
    os.makedirs(CERTS, exist_ok=True)
    for src, name, do_trim in LOGO_FILES:
        im = Image.open(os.path.join(SRC, src)).convert('RGB')
        if do_trim:
            im = trim(im)
        im.resize((256, 256), Image.LANCZOS).save(os.path.join(LOGOS, f'{name}.png'), optimize=True)
        print('logo', name)
    for label, name in CERT_FILES:
        doc = fitz.open(os.path.join(SRC, f'Palantir Foundry {label} Certificate.pdf'))
        pix = doc[0].get_pixmap(dpi=110)
        im = Image.open(io.BytesIO(pix.tobytes('png'))).convert('RGB')
        if im.width > 1400:
            im = im.resize((1400, round(im.height * 1400 / im.width)), Image.LANCZOS)
        im.save(os.path.join(CERTS, f'{name}.jpg'), quality=84, optimize=True)
        print('cert', name, im.size)


if __name__ == '__main__':
    sys.exit(main())
