from PIL import Image
import os

files = ['public/pwa-192x192.png', 'public/pwa-512x512.png']

for file_path in files:
    try:
        if os.path.exists(file_path):
            img = Image.open(file_path)
            print(f"Processing {file_path}: Format={img.format}, Size={img.size}")
            
            # Force convert to PNG
            if img.format != 'PNG':
                print(f"Converting {file_path} to PNG...")
                img.save(file_path, 'PNG')
                print(f"Saved {file_path} as PNG.")
            
            # Verify
            img = Image.open(file_path)
            print(f"Verified {file_path}: Format={img.format}, Size={img.size}")
        else:
            print(f"File not found: {file_path}")
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
