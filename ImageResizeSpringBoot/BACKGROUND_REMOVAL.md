# Background removal setup

Install the Python packages once before running the Spring Boot application:

```bash
python3 -m pip install -r requirements.txt
```

`rembg` downloads its foreground-segmentation model the first time a preview is generated. The model is then cached locally for subsequent previews.
