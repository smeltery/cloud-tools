# Supported formats

The interface offers these output formats. Actual conversion also depends on the source file and available processing engines.

## Choose an output

| Tool              | Browser output choices | Engine  |
| ----------------- | ---------------------- | ------- |
| Images            | JPG, PNG, WebP, GIF    | Sharp   |
| Audio             | MP3, WAV, OGG, FLAC    | FFmpeg  |
| Video             | MP4, MOV, AVI, WebM    | FFmpeg  |
| eBooks            | EPUB, MOBI, PDF, AZW3  | Calibre |
| Image compression | Original format        | Sharp   |
| PDF compression   | PDF                    | pdf-lib |

The format selector excludes the current extension. This table describes the UI; it is not a guarantee that every input/output combination works. Consult the worker implementation when extending formats.

## Native dependencies

FFmpeg must be available on the worker PATH for audio and video. Calibre's `ebook-convert` must be available for eBooks. Sharp and pdf-lib are JavaScript dependencies installed with Bun.

## Compression trade-offs

Lossy compression changes image data. PDF processing optimizes structure and removes metadata; it does not guarantee a smaller output or raster-image downsampling. Keep your original and inspect the result.
