const express = require("express");
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const P = require("pino");

const app = express();
const PORT = process.env.PORT || 10000;

app.get("/", (req, res) => {
    res.send("C-Jax Bot Running 👾🔥");
});

app.listen(PORT, () => {
    console.log(`Web server running on port ${PORT}`);
});

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: P({ level: "silent" }),
        auth: state,
        browser: ["C-Jax", "Chrome", "1.0.0"]
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === "close") {
            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

            console.log("Connection closed. Reconnecting...");

            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === "open") {
            console.log("🔥 C-Jax Bot Connected Successfully!");
        }
    });

    // 👇 ENTER YOUR NUMBER HERE (country code, no +)
    const phoneNumber = "2347076849343";

    if (!state.creds.registered) {
        console.log("Requesting pairing code...");
        const code = await sock.requestPairingCode(phoneNumber);
        console.log("Enter this code in WhatsApp:", code);
    }
}

startBot();
