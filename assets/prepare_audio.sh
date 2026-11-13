#!/usr/bin/env bash
# VoxFable Audio Preparation Script (Bash/Linux/macOS)
# Trims, normalises loudness, and encodes to lightweight MP3.

set -euo pipefail

INPUT_DIR="${1:-./raw_audio}"
OUTPUT_DIR="${2:-./audio}"

FFMPEG_BIN="$(command -v ffmpeg || true)"
if [ -z "$FFMPEG_BIN" ]; then
  echo "FFmpeg not found on PATH. Please install ffmpeg." >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR/sfx" "$OUTPUT_DIR/music"

# Convert SFX (mono, 96 kbps, loudnorm -16 LUFS)
echo "Processing SFX..."
if [ -d "$INPUT_DIR/sfx" ]; then
  for file in "$INPUT_DIR/sfx"/*; do
    [ -e "$file" ] || continue
    base="$(basename "$file" | cut -f 1 -d '.')"
    out="$OUTPUT_DIR/sfx/${base}.mp3"
    echo "Encoding SFX: $file -> $out"
    "$FFMPEG_BIN" -y -i "$file" -vn -ar 44100 -ac 1 -b:a 96k -af "loudnorm=I=-16:TP=-1.5:LRA=11" "$out"
  done
fi

# Convert Music (stereo, 128 kbps, loudnorm -18 LUFS)
echo "Processing Music..."
if [ -d "$INPUT_DIR/music" ]; then
  for file in "$INPUT_DIR/music"/*; do
    [ -e "$file" ] || continue
    base="$(basename "$file" | cut -f 1 -d '.')"
    out="$OUTPUT_DIR/music/${base}.mp3"
    echo "Encoding Music: $file -> $out"
    "$FFMPEG_BIN" -y -i "$file" -vn -ar 44100 -ac 2 -b:a 128k -af "loudnorm=I=-18:TP=-1.5:LRA=14" "$out"
  done
fi

echo "Audio encoding complete."
