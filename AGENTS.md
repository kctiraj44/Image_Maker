# Passport Photo Maker — Development Instructions

## Project overview

This project is a web application for creating US passport photos.

The application allows a user to:

- Upload a personal photo
- Crop and position the face
- Validate the photo against US passport-photo rules
- Remove or replace the background when necessary
- Generate a printable passport-photo layout
- Download the final image

## Technology stack

### Frontend

- Angular
- TypeScript
- HTML
- CSS
- Angular reactive forms
- Angular HttpClient

### Backend

- Java
- Spring Boot
- Spring Web
- Spring Data JPA
- H2 database
- Maven
- JUnit 5
- Mockito

## Architecture rules

### Angular frontend

- Components should manage presentation and user interaction.
- Business logic should be placed in Angular services.
- API calls must be placed in services.
- Do not place HTTP calls directly inside components.
- Use strongly typed TypeScript interfaces.
- Avoid using `any`.
- Use reactive forms for forms and validation.
- Keep components small and focused.
- Reuse existing components and services before creating new ones.

### Spring Boot backend

- Controllers should only handle HTTP requests and responses.
- Business logic belongs in service classes.
- Database operations belong in repository classes.
- Use DTOs for API requests and responses.
- Do not expose JPA entities directly through REST endpoints.
- Use dependency injection through constructors.
- Add centralized exception handling where appropriate.
- Validate all user input.
- Do not store uploaded image data permanently unless required.

## Coding rules

- Follow the existing project structure and naming conventions.
- Do not modify unrelated files.
- Do not add dependencies unless necessary.
- Explain why a new dependency is required before adding it.
- Do not duplicate existing functionality.
- Use clear names for classes, methods, variables, and files.
- Keep methods small and focused.
- Add comments only when the logic is not obvious.
- Do not put secrets, API keys, or credentials in source code.
- Do not log uploaded photos or other private user data.

## Image-processing rules

- Preserve the original uploaded image.
- Do not overwrite the original image.
- Validate image type before processing.
- Accept only supported formats such as JPEG and PNG.
- Enforce a reasonable maximum file size.
- Preserve image quality when resizing.
- Maintain the correct aspect ratio.
- Handle image rotation caused by EXIF orientation.
- Return clear validation errors to the user.
- Do not claim that a generated image is officially accepted or guaranteed by the US government.

## US passport-photo rules

Use the requirements defined in:

`spec/image_maker.md`

Do not invent passport-photo measurements or requirements.

When a requirement is unclear, ask for clarification before implementing it.

## Testing requirements

### Frontend

Run:

```bash
npm test