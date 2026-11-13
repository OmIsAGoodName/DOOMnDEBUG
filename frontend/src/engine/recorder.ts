export interface RecorderOptions {
  canvas: HTMLCanvasElement;
  audioDestination?: MediaStreamAudioDestinationNode;
  fps?: number;
  videoBitsPerSecond?: number;
}

export class EpisodeRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private selectedMimeType = 'video/webm';
  private stopPromiseResolver: ((blob: Blob) => void) | null = null;

  constructor(private options: RecorderOptions) {}

  public isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  public start(): void {
    const fps = this.options.fps || 30;
    const stream = this.options.canvas.captureStream(fps);

    if (this.options.audioDestination) {
      const audioTracks = this.options.audioDestination.stream.getAudioTracks();
      if (audioTracks.length > 0) {
        stream.addTrack(audioTracks[0]);
      }
    }

    const preferredMimes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ];

    this.selectedMimeType = 'video/webm';
    for (const mime of preferredMimes) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime)) {
        this.selectedMimeType = mime;
        break;
      }
    }

    this.recordedChunks = [];

    try {
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: this.selectedMimeType,
        videoBitsPerSecond: this.options.videoBitsPerSecond || 4000000,
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const fullBlob = new Blob(this.recordedChunks, { type: this.selectedMimeType });
        if (this.stopPromiseResolver) {
          this.stopPromiseResolver(fullBlob);
          this.stopPromiseResolver = null;
        }
      };

      this.mediaRecorder.start(100); // 100ms chunk timeslice
    } catch (err) {
      console.warn('[EpisodeRecorder] Failed to start MediaRecorder:', err);
    }
  }

  public stop(): Promise<Blob> {
    return new Promise<Blob>((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        resolve(new Blob([], { type: this.selectedMimeType }));
        return;
      }
      this.stopPromiseResolver = resolve;
      this.mediaRecorder.stop();
    });
  }
}
