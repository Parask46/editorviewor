import os
import webview

def main():
    # Target directory containing index.html
    project_dir = r"C:\editorviewor"
    index_file = os.path.join(project_dir, "index.html")

    # Ensure the file exists before launching
    if not os.path.exists(index_file):
        print(f"Error: Could not find 'index.html' in {project_dir}")
        return

    # Create native desktop window pointing to your index.html
    window = webview.create_window(
        title="Orbital Studio",
        url=index_file,
        width=1400,
        height=900,
        resizable=True,
        min_size=(800, 600)
    )

    # Start the app window loop
    webview.start()

if __name__ == "__main__":
    main()