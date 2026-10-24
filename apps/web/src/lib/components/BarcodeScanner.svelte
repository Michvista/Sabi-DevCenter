<script lang="ts">
  import { onDestroy } from "svelte";

  type Detector = {
    detect(source: CanvasImageSource): Promise<Array<{ rawValue: string }>>;
  };
  type DetectorConstructor = new (options: { formats: string[] }) => Detector;
  let { onDetected }: { onDetected: (value: string) => void } = $props();
  let video = $state<HTMLVideoElement>();
  let stream: MediaStream | undefined;
  let scanning = $state(false);
  let message = $state("");
  let detector: Detector | undefined;
  let frame = 0;

  function stop() {
    scanning = false;
    cancelAnimationFrame(frame);
    stream?.getTracks().forEach((track) => track.stop());
    stream = undefined;
  }
  onDestroy(stop);

  async function scan() {
    const BarcodeDetectorApi = (
      globalThis as typeof globalThis & {
        BarcodeDetector?: DetectorConstructor;
      }
    ).BarcodeDetector;
    if (!BarcodeDetectorApi) {
      message =
        "Camera barcode scanning is not supported in this browser. Enter the barcode above instead.";
      return;
    }
    try {
      detector = new BarcodeDetectorApi({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e"],
      });
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      if (!video) throw new Error("Camera preview is unavailable.");
      video.srcObject = stream;
      await video.play();
      scanning = true;
      message = "Hold the barcode inside the camera frame.";
      const tick = async () => {
        if (!scanning || !detector || !video) return;
        try {
          const results = await detector.detect(video);
          if (results[0]?.rawValue) {
            const value = results[0].rawValue;
            stop();
            onDetected(value);
            message = `Barcode detected: ${value}`;
            return;
          }
        } catch {
          message = "Could not read the barcode. Try entering it manually.";
        }
        frame = requestAnimationFrame(() => void tick());
      };
      void tick();
    } catch {
      stop();
      message =
        "Camera access was denied or unavailable. Enter the barcode manually.";
    }
  }
</script>

<div class="barcode-camera">
  <button type="button" onclick={() => (scanning ? stop() : void scan())}>
    {scanning ? "Stop camera" : "Scan with camera"}
  </button>
  {#if scanning}<video
      bind:this={video}
      playsinline
      muted
      aria-label="Barcode camera preview"
    ></video>{/if}
  {#if message}<small role="status">{message}</small>{/if}
</div>
