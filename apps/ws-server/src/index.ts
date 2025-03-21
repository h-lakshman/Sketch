import WebSocketServerSingleton from "./WebSocketServer";

const wss = WebSocketServerSingleton.getInstance();

process.on("SIGINT", () => {
  console.log("Shutting down WebSocket server...");
  wss.closeAllConnections();
  process.exit(0);
});
