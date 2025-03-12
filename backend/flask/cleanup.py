import os
import time
from datetime import datetime, timedelta

OUTPUT_FOLDER = "./output/"

def delete_old_sessions():
    now = time.time()
    cutoff = now - (48 * 60 * 60) #48 hours

    for root, dirs, files in os.walk(OUTPUT_FOLDER):
        for file in files:
            file_path = os.path.join(root, file)
            if os.path.getmtime(file_path) < cutoff:
                os.remove(file_path)

        # Remove empty directories after deleting files
        for dir in dirs:
            dir_path = os.path.join(root, dir)
            if not os.listdir(dir_path):  # If directory is empty
                os.rmdir(dir_path)


if __name__ == "__main__":
    delete_old_sessions()
