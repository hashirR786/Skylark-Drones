import os
import zipfile

def create_submission_zip(output_filename="skylark_monday_bi_agent_submission.zip"):
    exclude_dirs = {"node_modules", "dist", ".git", ".gemini", "__pycache__"}
    exclude_files = {output_filename, ".DS_Store"}

    print(f"Creating submission archive: {output_filename}")
    with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk("."):
            # Filter out ignored directories
            dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('.')]
            
            for file in files:
                if file in exclude_files or file.endswith('.zip') or file.endswith('.pyc'):
                    continue
                file_path = os.path.join(root, file)
                archive_name = os.path.relpath(file_path, ".")
                zipf.write(file_path, archive_name)
                print(f"  Added: {archive_name}")

    print(f"Successfully generated {output_filename} ({os.path.getsize(output_filename) / 1024:.1f} KB)")

if __name__ == "__main__":
    create_submission_zip()
