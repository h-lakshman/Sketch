import express from "express";
import authRouter from "./routes/authRouter";
import roomRouter from "./routes/roomRoutere";
const app = express();

app.use(express.json());

app.use("/auth", authRouter);
app.use("/room", roomRouter);
app.get("/", (req, res) => {
  res.send("Server is running ");
});

app.listen(3001, () => {
  console.log("server is running");
});
