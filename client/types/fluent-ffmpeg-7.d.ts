/**
 * Type declarations for fluent-ffmpeg-7
 *
 * Since fluent-ffmpeg-7 is a maintained fork of fluent-ffmpeg with the same API,
 * we can safely use the existing @types/fluent-ffmpeg type definitions.
 */

declare module 'fluent-ffmpeg-7' {
  // Import all types and interfaces from fluent-ffmpeg
  import Ffmpeg from 'fluent-ffmpeg';

  // Re-export everything from fluent-ffmpeg
  export = Ffmpeg;
}
