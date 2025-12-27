from PIL import Image
import os

files = [
    'public/pwa-192x192.png',
    'public/pwa-512x512.png',
    'public/screenshot-desktop.png',
    'public/screenshot-mobile.png'
]

for f in files:
    try:
        if os.path.exists(f):
            with Image.open(f) as img:
                print(f"{f}: {img.size}")
        else:
            print(f"{f}: Not found")
    except Exception as e:
        print(f"{f}: Error {e}")
