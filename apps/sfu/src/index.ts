import "dotenv/config";
import * as mediasoup from "mediasoup";
import { WebSocketServer } from "ws";

const SFU_LISTEN_IP = process.env.SFU_LISTEN_IP ?? "0.0.0.0";
const SFU_ANNOUNCED_IP = process.env.SFU_ANNOUNCED_IP ?? "127.0.0.1";
const SFU_PORT_RANGE_MIN = parseInt(process.env.SFU_PORT_RANGE_MIN ?? "40000", 10);
const SFU_PORT_RANGE_MAX = parseInt(process.env.SFU_PORT_RANGE_MAX ?? "40100", 10);
const SFU_WS_PORT = parseInt(process.env.SFU_WS_PORT ?? "3001", 10);

async function run() {
  const worker = await mediasoup.createWorker({
    logLevel: "warn",
    rtcMinPort: SFU_PORT_RANGE_MIN,
    rtcMaxPort: SFU_PORT_RANGE_MAX,
  });

  const router = await worker.createRouter({
    mediaCodecs: [
      {
        kind: "audio",
        mimeType: "audio/opus",
        clockRate: 48000,
        channels: 2,
      },
      {
        kind: "video",
        mimeType: "video/VP8",
        clockRate: 90000,
      },
      {
        kind: "video",
        mimeType: "video/H264",
        clockRate: 90000,
        parameters: {
          "packetization-mode": 1,
          "profile-level-id": "42e01f",
        },
      },
    ],
  });

  const wss = new WebSocketServer({ port: SFU_WS_PORT });
  console.log(`SFU WebSocket listening on port ${SFU_WS_PORT}`);

  wss.on("connection", (ws) => {
    ws.on("message", async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        switch (msg.type) {
          case "getRtpCapabilities": {
            const caps = router.rtpCapabilities;
            ws.send(JSON.stringify({ type: "rtpCapabilities", data: caps }));
            break;
          }
          case "createWebRtcTransport": {
            const transport = await router.createWebRtcTransport({
              listenIps: [{ ip: SFU_LISTEN_IP, announcedIp: SFU_ANNOUNCED_IP }],
              enableUdp: true,
              enableTcp: true,
              preferUdp: true,
            });
            ws.send(
              JSON.stringify({
                type: "webRtcTransportCreated",
                data: {
                  id: transport.id,
                  iceParameters: transport.iceParameters,
                  iceCandidates: transport.iceCandidates,
                  dtlsParameters: transport.dtlsParameters,
                },
              })
            );
            break;
          }
          default:
            break;
        }
      } catch (err) {
        console.error("SFU message error:", err);
      }
    });
  });
}

run().catch((err) => {
  console.error("SFU failed:", err);
  process.exit(1);
});
