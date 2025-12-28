from PIL import Image
import os

files = [
    ('public/pwa-192x192.png', (192, 192)),
    ('public/pwa-512x512.png', (512, 512))
]

for file_path, target_size in files:
    try:
        if os.path.exists(file_path):
            img = Image.open(file_path)
            print(f"Processing {file_path}: Current Size={img.size}, Target Size={target_size}")
            
            if img.size != target_size:
                print(f"Resizing {file_path}...")
                img = img.resize(target_size, Image.Resampling.LANCZOS)
                img.save(file_path, 'PNG')
                print(f"Resized and saved {file_path}.")
            
            # Verify
            img = Image.open(file_path)
            print(f"Verified {file_path}: Format={img.format}, Size={img.size}")
        else:
            print(f"File not found: {file_path}")
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
