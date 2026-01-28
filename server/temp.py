import os
from PIL import Image, ImageOps

def get_dir_size(size_in_bytes):
    """Helper to convert bytes to a readable format (MB)."""
    return round(size_in_bytes / (1024 * 1024), 2)

def compress_images(source_dir, output_dir, max_width=800, quality=80):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Created directory: {output_dir}")

    valid_extensions = ('.jpg', '.jpeg', '.png', '.webp')
    
    total_old_size = 0
    total_new_size = 0
    file_count = 0

    print("--- Starting Compression ---")

    for filename in os.listdir(source_dir):
        if filename.lower().endswith(valid_extensions):
            file_path = os.path.join(source_dir, filename)
            
            # Record original size
            total_old_size += os.path.getsize(file_path)
            
            try:
                with Image.open(file_path) as img:
                    # Fix orientation (Prevents unwanted rotation)
                    img = ImageOps.exif_transpose(img)

                    # Convert to RGB (Required for JPEG)
                    if img.mode != "RGB":
                        img = img.convert("RGB")

                    # Resize maintaining aspect ratio
                    if img.size[0] > max_width:
                        w_percent = (max_width / float(img.size[0]))
                        h_size = int((float(img.size[1]) * float(w_percent)))
                        img = img.resize((max_width, h_size), Image.LANCZOS)
                    
                    # Save as JPG
                    base_name = os.path.splitext(filename)[0]
                    output_path = os.path.join(output_dir, f"{base_name}.jpg")
                    img.save(output_path, "JPEG", quality=quality, optimize=True)
                    
                    # Record new size
                    total_new_size += os.path.getsize(output_path)
                    file_count += 1
                    
                    print(f"Processed: {filename}")
            
            except Exception as e:
                print(f"Error processing {filename}: {e}")

    # --- SHOW TOTAL SIZE SUMMARY ---
    old_mb = get_dir_size(total_old_size)
    new_mb = get_dir_size(total_new_size)
    savings = round(((total_old_size - total_new_size) / total_old_size) * 100, 2) if total_old_size > 0 else 0

    print("\n" + "="*40)
    print(f"FINAL REPORT")
    print("="*40)
    print(f"Total Files Processed:  {file_count}")
    print(f"Original Total Size:    {old_mb} MB")
    print(f"Compressed Total Size:  {new_mb} MB")
    print(f"Space Saved:           {savings}%")
    print("="*40)

# --- SETTINGS ---
SOURCE_PATH = './uploads/students/SOURCE'
DEST_PATH = './uploads/students/cohort-03'
MAX_WIDTH = 800
QUALITY = 75

compress_images(SOURCE_PATH, DEST_PATH, MAX_WIDTH, QUALITY)