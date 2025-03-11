import express from "express";
import authRouter from "./routes/authRouter";
const app = express();

app.use(express.json());

app.use("/auth", authRouter);

app.get("/", (req, res) => {
  res.send("Server is running ");
});

app.listen(3001, () => {
  console.log("server is running");
});
