import os
import shutil

def copy_files_to_files_directory():
    # Get the current directory where the script is located
    current_dir = os.path.dirname(os.path.abspath(__file__))
    src_dir = os.path.join(current_dir, 'src')
    dest_dir = os.path.join(current_dir, 'Files')

    # Create the destination directory if it doesn't exist
    if not os.path.exists(dest_dir):
        os.makedirs(dest_dir)

    # Walk through the src directory and its subdirectories
    for root, _, files in os.walk(src_dir):
        for file in files:
            src_file_path = os.path.join(root, file)
            dest_file_path = os.path.join(dest_dir, file)

            # Copy the file to the destination directory
            shutil.copy2(src_file_path, dest_file_path)
            print(f"Copied: {src_file_path} -> {dest_file_path}")

if __name__ == "__main__":
    copy_files_to_files_directory()
