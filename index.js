const express = require("express");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} = require("@whiskeysockets/baileys");
const pino = require("pino");

const app = express();
const PORT = process.env.PORT || 3000;

// Simple web route (important for Render)
app.get("/", (req, res) => {
  res.send("C-Jax Bot is running 👾");
});

app.listen(PORT, () => {
  console.log("Web server running on port " + PORT);
});

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    auth: state,
    browser: ["C-Jax", "Chrome", "1.0.0"]
  });

  sock.ev.on("creds.update", saveCreds);

  let pairingRequested = false;

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "connecting") {
      console.log("Connecting to WhatsApp...");
    }

    if (connection === "open") {
      console.log("✅ C-Jax Bot Connected Successfully!");
    }

    if (!sock.authState.creds.registered && !pairingRequested) {
      pairingRequested = true;

      const phoneNumber = "2347076849343"; // PUT YOUR NUMBER HERE

      try {
        const code = await sock.requestPairingCode(phoneNumber);
        console.log("🔥 Pairing Code:", code);
      } catch (err) {
        console.log("Pairing failed:", err.message);
      }
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

      if (shouldReconnect) {
        console.log("Reconnecting...");
        startBot();
      }
    }
  });
}

startBot();
