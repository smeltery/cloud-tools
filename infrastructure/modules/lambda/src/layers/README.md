# Lambda Layers for Cloud Tools

This directory contains configuration and scripts for creating Lambda Layers that provide binary dependencies for file processing.

## Binary Dependencies Layer

The binary dependencies layer includes:

- Sharp (native image processing binaries)
- FFmpeg (video/audio processing binaries)
- Other native dependencies

### Creating the Layer

1. **Sharp Layer** (for image processing):

   ```bash
   mkdir -p layers/sharp/nodejs
   cd layers/sharp/nodejs
   npm init -y
   npm install sharp --platform=linux --arch=x64
   ```

2. **FFmpeg Layer** (for video/audio processing):

   ```bash
   # Use pre-built FFmpeg Layer ARN or create custom one
   # FFmpeg Layer ARN: arn:aws:lambda:us-east-1:145266761615:layer:ffmpeg:4
   ```

3. **Create ZIP files**:

   ```bash
   cd layers/sharp
   zip -r sharp-layer.zip nodejs/
   ```

### Layer ARNs

Common Layer ARNs you can use instead of building custom layers:

- **FFmpeg**: `arn:aws:lambda:us-east-1:145266761615:layer:ffmpeg:4`
- **Sharp**: Available through AWS Lambda Layers community or build custom

### Terraform Configuration

Update your Terraform Lambda functions to use layers:

```hcl
resource "aws_lambda_function" "convert" {
  # ... other configuration ...

  layers = [
    "arn:aws:lambda:us-east-1:145266761615:layer:ffmpeg:4",  # FFmpeg
    aws_lambda_layer_version.sharp.arn                       # Custom Sharp layer
  ]
}

resource "aws_lambda_layer_version" "sharp" {
  filename   = "layers/sharp-layer.zip"
  layer_name = "sharp-layer"

  compatible_runtimes = ["nodejs18.x"]
}
```

### Environment Variables

Set these environment variables in your Lambda functions:

- `FFMPEG_PATH`: `/opt/ffmpeg/bin/ffmpeg`
- `FFPROBE_PATH`: `/opt/ffmpeg/bin/ffprobe`
- `LD_LIBRARY_PATH`: `/opt/lib`

### Size Optimization

Using layers helps keep your deployment packages smaller:

- Without layers: ~50-100MB per function
- With layers: ~5-10MB per function (much faster cold starts)
