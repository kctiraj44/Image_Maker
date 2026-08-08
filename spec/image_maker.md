
## Put this in `spec/image_maker.md`

```markdown
# US Passport Photo Maker Specification

## Feature name

US Passport Photo Maker

## Goal

Build a single-page web application that helps users create a properly sized US passport photo from an uploaded image.

The user should be able to upload a photo, position and crop it, validate basic requirements, preview the result, and download a final passport-photo image.

## User story

As a user,
I want to upload and adjust my photo,
so that I can create a properly formatted US passport photo.

## Main workflow

1. The user opens the passport-photo maker page.
2. The user uploads a JPEG or PNG image.
3. The application validates the file.
4. The user sees the uploaded image in a crop editor.
5. The user can zoom, move, rotate, and crop the image.
6. The application displays a passport-photo guide overlay.
7. The user previews the processed image.
8. The user confirms the result.
9. The application generates a final passport-photo image.
10. The user downloads the generated image.

## Functional requirements

### 1. Image upload

The application must:

- Allow JPEG and PNG uploads.
- Reject unsupported file types.
- Reject empty files.
- Reject files larger than the configured limit.
- Show a clear error message when validation fails.
- Display an image preview after a successful upload.
- Correct image orientation using EXIF orientation when necessary.

### 2. Crop editor

The crop editor must allow the user to:

- Move the image
- Zoom in
- Zoom out
- Rotate the image
- Reset adjustments
- Crop using a fixed square aspect ratio

The original uploaded image must not be overwritten.

### 3. Passport-photo guide

The editor should display a guide that helps the user position the face.

The guide should indicate:

- The expected head area
- The center of the photo
- Space above the head
- The visible shoulder area

The guide is advisory and must not claim official government approval.

### 4. Output dimensions

The generated digital passport photo should use a square layout.

Target output:

- Width: 600 pixels
- Height: 600 pixels
- Format: JPEG
- Standard color image
- High enough quality to avoid visible compression artifacts

The application should preserve image clarity during resizing.

### 5. Background

The application should guide the user toward a plain white or off-white background.

For the first version:

- Display a warning when the background may not be suitable.
- Allow the user to continue after acknowledging the warning.

Optional later feature:

- Automatic background removal
- Automatic white-background replacement

Do not implement automatic background removal unless it is already supported or separately approved.

### 6. Basic validation

The application should validate or warn about:

- No image uploaded
- Unsupported format
- File too large
- Image resolution too low
- Face not detected
- More than one face detected
- Face positioned too close to an edge
- Face appears too small or too large
- Image is excessively dark
- Image is excessively bright
- Background may not be plain
- Image may be blurry

Validation results must be separated into:

- Errors that block generation
- Warnings that allow the user to continue

### 7. Preview

Before downloading, the application must show:

- The final cropped photo
- Output dimensions
- Validation errors
- Validation warnings
- A button to return to editing
- A button to generate or download the image

### 8. Download

The user must be able to download:

#### Digital photo

- One square passport photo
- JPEG format
- 600 by 600 pixels

#### Optional printable sheet

A later version may generate:

- A 4 × 6 inch printable sheet
- Multiple 2 × 2 inch passport photos
- Print-quality resolution

Do not implement the printable sheet unless included in the approved plan.

## Frontend requirements

Create or reuse Angular components such as:

- `ImageUploadComponent`
- `ImageEditorComponent`
- `PhotoValidationComponent`
- `PhotoPreviewComponent`
- `DownloadComponent`

Create or reuse Angular services such as:

- `ImageService`
- `PassportPhotoService`
- `PhotoValidationService`

All backend communication must be handled by Angular services.

Do not call `HttpClient` directly from components.

## Backend requirements

The Spring Boot backend should provide endpoints for image processing.

Suggested endpoints:

### Upload and process image

```http
POST /api/passport-photo/process