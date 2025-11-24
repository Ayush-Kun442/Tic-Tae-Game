# Tic Tac Toe (Friends, CPU & Online)

A zero-build Tic Tac Toe that runs in any modern browser. Play locally, challenge the built-in unbeatable computer, or invite a friend through the new online mode powered by Peer-to-Peer connections.

## Quick start

1. Open `index.html` in your browser (double click or serve with any static server).
2. Pick a mode under **Mode**:
   - **Friend vs Friend** – pass-and-play on one device.
   - **You vs Computer** – battle a perfect minimax AI.
   - **Online Play (beta)** – create a room ID, share it, and play in real time.
3. Customize player names (where applicable), click squares to place marks, and watch the animated scoreboard/results update.

Use **Reset Game** to clear both the board and the running scores. Switching modes keeps scores unless you hit Reset.

## Online mode details

- Online mode uses [PeerJS](https://peerjs.com) with the public signaling server. Both players must have a stable internet connection and keep the game tab open.
- The room creator always plays **X**; the guest plays **O**. Share the generated room ID via chat/text and the guest enters it to join.
- Because it is peer-to-peer, no personal data leaves your browser beyond what WebRTC requires to make the connection.

## Deploying online

The project is fully static—upload the three files somewhere and you are live:

- **GitHub Pages** – create a repo, push the files, and enable Pages on the `main` branch.
- **Netlify / Vercel / Render** – drag-and-drop the folder or connect a repo; no build command needed.
- **Any static host** – e.g., `npx serve .` locally or an S3 bucket, Azure Static Web Apps, etc.

Once hosted, share the URL with friends; they can play solo or use the online mode right from the deployed page.

## Project structure

- `index.html` – layout, controls, and online-ready markup
- `styles.css` – responsive layout plus mark/result animations
- `script.js` – gameplay state, win checks, CPU AI, and online sync logic (PeerJS)

Feel free to extend the visuals or add features like chat, move history, or better matchmaking. Everything is dependency-free aside from the PeerJS CDN include used for online play.

