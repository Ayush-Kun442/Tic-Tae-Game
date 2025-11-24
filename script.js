const boardButtons = Array.from(document.querySelectorAll(".board button"));
const modeSelect = document.getElementById("mode-select");
const resetBtn = document.getElementById("reset-btn");
const playerXInput = document.getElementById("player-x-name");
const playerOInput = document.getElementById("player-o-name");
const friendOnlyField = document.querySelector(".friend-only");
const onlineField = document.querySelector(".online-only");
const createRoomBtn = document.getElementById("create-room-btn");
const joinRoomBtn = document.getElementById("join-room-btn");
const copyRoomBtn = document.getElementById("copy-room-btn");
const roomIdDisplay = document.getElementById("room-id-display");
const roomIdInput = document.getElementById("room-id-input");
const onlineStatus = document.getElementById("online-status");
const turnIndicator = document.getElementById("turn-indicator");
const resultIndicator = document.getElementById("result-indicator");
const resultBanner = document.getElementById("result-banner");
const resultBannerText = document.getElementById("result-banner-text");
const scoreXEl = document.getElementById("score-x");
const scoreOEl = document.getElementById("score-o");
const scoreDrawEl = document.getElementById("score-draws");

const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const scores = {
  X: 0,
  O: 0,
  draws: 0,
};

const state = {
  board: Array(9).fill(""),
  current: "X",
  mode: "pvp",
  active: true,
};

const onlineState = {
  peer: null,
  conn: null,
  role: null,
  roomId: null,
  isHost: false,
};

function isOnlineMode() {
  return state.mode === "online";
}

function resetBoard({ keepScores = true, broadcast = false } = {}) {
  state.board.fill("");
  state.current = "X";
  state.active = true;
  boardButtons.forEach((btn) => {
    btn.textContent = "";
    btn.dataset.disabled = "false";
    btn.classList.remove("mark-x", "mark-o");
  });
  resultIndicator.textContent = "";
  hideResultBanner();
  updateTurnText();
  if (!keepScores) {
    scores.X = 0;
    scores.O = 0;
    scores.draws = 0;
    updateScores();
  }
  if (broadcast && isOnlineMode() && onlineState.conn) {
    onlineState.conn.send({ type: "reset", keepScores });
  }
}

function getDisplayName(symbol) {
  if (symbol === "X") {
    if (isOnlineMode()) {
      return onlineState.role === "X" ? "You" : "Friend";
    }
    return playerXInput.value.trim() || "Player X";
  }

  if (state.mode === "cpu") {
    return "Computer";
  }

  if (isOnlineMode()) {
    return onlineState.role === "O" ? "You" : "Friend";
  }

  return playerOInput.value.trim() || "Player O";
}

function updateTurnText(message) {
  if (message) {
    turnIndicator.textContent = message;
    return;
  }

  const playerName = getDisplayName(state.current);
  turnIndicator.textContent = `${playerName}'s turn (${state.current})`;
}

function updateScores() {
  scoreXEl.textContent = scores.X;
  scoreOEl.textContent = scores.O;
  scoreDrawEl.textContent = scores.draws;
}

function handleMove(index, player) {
  state.board[index] = player;
  const button = boardButtons[index];
  button.textContent = player;
  button.dataset.disabled = "true";
  button.classList.remove("mark-x", "mark-o");
  // restart animation
  void button.offsetWidth;
  button.classList.add(player === "X" ? "mark-x" : "mark-o");
}

function boardHasWinner(board) {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

function isBoardFull(board) {
  return board.every((cell) => cell);
}

function showResultBanner(message, variant) {
  resultBannerText.textContent = message;
  resultBannerText.className = variant === "draw" ? "draw" : "win";
  resultBanner.dataset.visible = "true";
}

function hideResultBanner() {
  resultBanner.dataset.visible = "false";
  resultBannerText.textContent = "";
  resultBannerText.className = "";
}

function finishGame(result) {
  state.active = false;
  boardButtons.forEach((btn) => (btn.dataset.disabled = "true"));

  if (result === "draw") {
    resultIndicator.textContent = "Draw! Nobody wins this round.";
    showResultBanner("It's a draw!", "draw");
    scores.draws += 1;
  } else {
    const winnerName = getDisplayName(result);
    resultIndicator.textContent = `${winnerName} wins!`;
    showResultBanner(`${winnerName} wins!`, "win");
    scores[result] += 1;
  }

  updateTurnText("Round finished");
  updateScores();
}

function evaluateBoardAfterMove(player, { triggerComputer = true } = {}) {
  const winner = boardHasWinner(state.board);
  if (winner) {
    finishGame(winner);
    return;
  }

  if (isBoardFull(state.board)) {
    finishGame("draw");
    return;
  }

  state.current = player === "X" ? "O" : "X";
  updateTurnText();

  if (triggerComputer && state.mode === "cpu" && state.current === "O") {
    setTimeout(computerMove, 450);
  }
}

function computerMove() {
  const index = findBestMove(state.board);
  handleMove(index, "O");
  evaluateBoardAfterMove("O", { triggerComputer: false });
}

function minimax(board, depth, isMax) {
  const winner = boardHasWinner(board);
  if (winner === "O") return 10 - depth;
  if (winner === "X") return depth - 10;
  if (isBoardFull(board)) return 0;

  if (isMax) {
    let best = -Infinity;
    for (let i = 0; i < board.length; i += 1) {
      if (board[i]) continue;
      board[i] = "O";
      best = Math.max(best, minimax(board, depth + 1, false));
      board[i] = "";
    }
    return best;
  }

  let best = Infinity;
  for (let i = 0; i < board.length; i += 1) {
    if (board[i]) continue;
    board[i] = "X";
    best = Math.min(best, minimax(board, depth + 1, true));
    board[i] = "";
  }
  return best;
}

function findBestMove(board) {
  let bestScore = -Infinity;
  let move = 0;

  for (let i = 0; i < board.length; i += 1) {
    if (board[i]) continue;
    board[i] = "O";
    const score = minimax(board, 0, false);
    board[i] = "";
    if (score > bestScore) {
      bestScore = score;
      move = i;
    }
  }

  return move;
}

function onCellClick(event) {
  if (!state.active) return;
  const index = Number(event.currentTarget.dataset.index);
  if (state.board[index]) return;
  if (isOnlineMode() && onlineState.role !== state.current) {
    setOnlineStatus("Wait for your turn...", "error");
    return;
  }

  const movingPlayer = state.current;
  handleMove(index, movingPlayer);
  evaluateBoardAfterMove(movingPlayer);

  if (isOnlineMode() && onlineState.conn) {
    onlineState.conn.send({ type: "move", index, player: movingPlayer });
  }
}

function handleRemoteMove(index, player) {
  if (!state.active || state.board[index]) return;
  handleMove(index, player);
  evaluateBoardAfterMove(player, { triggerComputer: false });
}

function setOnlineStatus(message, variant = "info") {
  if (!onlineStatus) return;
  onlineStatus.textContent = message;
  onlineStatus.classList.remove("status-success", "status-error");
  if (variant === "success") {
    onlineStatus.classList.add("status-success");
  } else if (variant === "error") {
    onlineStatus.classList.add("status-error");
  }
}

function teardownOnline() {
  if (onlineState.conn) {
    onlineState.conn.close();
  }
  if (onlineState.peer) {
    onlineState.peer.destroy();
  }
  onlineState.peer = null;
  onlineState.conn = null;
  onlineState.role = null;
  onlineState.roomId = null;
  onlineState.isHost = false;
  roomIdDisplay.textContent = "-";
  setOnlineStatus("Not connected");
}

function bindConnection(conn) {
  onlineState.conn = conn;
  setOnlineStatus("Connected! X starts first.", "success");
  conn.on("data", handleOnlineMessage);
  conn.on("close", () => {
    setOnlineStatus("Connection closed. Recreate or rejoin.", "error");
    onlineState.conn = null;
  });
  if (onlineState.isHost) {
    resetBoard({ keepScores: true, broadcast: true });
  }
}

function handleOnlineMessage(payload) {
  if (!payload) return;
  if (payload.type === "move") {
    handleRemoteMove(payload.index, payload.player);
    setOnlineStatus("Your turn!", "success");
  } else if (payload.type === "reset") {
    resetBoard({ keepScores: payload.keepScores, broadcast: false });
  }
}

function handleCreateRoom() {
  if (typeof Peer === "undefined") {
    setOnlineStatus("PeerJS failed to load.", "error");
    return;
  }
  teardownOnline();
  setOnlineStatus("Creating room…");
  onlineState.isHost = true;
  onlineState.role = "X";
  const peer = new Peer();
  onlineState.peer = peer;
  peer.on("open", (id) => {
    onlineState.roomId = id;
    roomIdDisplay.textContent = id;
    setOnlineStatus("Share the room ID with your friend.", "success");
  });
  peer.on("connection", (conn) => {
    if (onlineState.conn) {
      conn.close();
      return;
    }
    bindConnection(conn);
  });
  peer.on("error", (err) => {
    setOnlineStatus(err?.message || "Unable to create room.", "error");
  });
}

function handleJoinRoom() {
  if (typeof Peer === "undefined") {
    setOnlineStatus("PeerJS failed to load.", "error");
    return;
  }
  const roomId = roomIdInput.value.trim();
  if (!roomId) {
    setOnlineStatus("Enter your friend's room ID first.", "error");
    return;
  }

  teardownOnline();
  setOnlineStatus("Connecting…");
  onlineState.role = "O";
  onlineState.isHost = false;
  const peer = new Peer();
  onlineState.peer = peer;
  peer.on("open", () => {
    const conn = peer.connect(roomId);
    conn.on("open", () => bindConnection(conn));
    conn.on("error", (err) => {
      setOnlineStatus(err?.message || "Connection failed.", "error");
    });
  });
  peer.on("error", (err) => {
    setOnlineStatus(err?.message || "Unable to connect.", "error");
  });
}

function copyRoomId() {
  if (!onlineState.roomId) {
    setOnlineStatus("Create a room first to get an ID.", "error");
    return;
  }
  if (!navigator.clipboard) {
    setOnlineStatus("Clipboard not available.", "error");
    return;
  }
  navigator.clipboard
    .writeText(onlineState.roomId)
    .then(() => setOnlineStatus("Room ID copied!", "success"))
    .catch(() => setOnlineStatus("Clipboard not available.", "error"));
}

function handleModeChange() {
  state.mode = modeSelect.value;
  friendOnlyField.style.display = state.mode === "pvp" ? "flex" : "none";
  if (onlineField) {
    onlineField.style.display = state.mode === "online" ? "flex" : "none";
  }

  if (state.mode === "cpu") {
    playerOInput.value = "Computer";
    playerOInput.disabled = true;
    teardownOnline();
  } else if (state.mode === "online") {
    playerOInput.value = "Online friend";
    playerOInput.disabled = true;
    setOnlineStatus("Create or join a room to play online.");
  } else {
    playerOInput.disabled = false;
    if (
      !playerOInput.value ||
      playerOInput.value === "Computer" ||
      playerOInput.value === "Online friend"
    ) {
      playerOInput.value = "Player 2";
    }
    teardownOnline();
  }

  resetBoard({ keepScores: true, broadcast: false });
}

boardButtons.forEach((button) => button.addEventListener("click", onCellClick));
modeSelect.addEventListener("change", handleModeChange);
resetBtn.addEventListener("click", () =>
  resetBoard({ keepScores: false, broadcast: isOnlineMode() })
);

createRoomBtn?.addEventListener("click", handleCreateRoom);
joinRoomBtn?.addEventListener("click", handleJoinRoom);
copyRoomBtn?.addEventListener("click", copyRoomId);

resetBoard({ keepScores: true });

