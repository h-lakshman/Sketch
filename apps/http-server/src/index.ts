import express from "express";
import cors from "cors";
import authRouter from "./routes/authRouter";
import roomRouter from "./routes/roomRoutere";
const app = express();
app.use(
  cors({
    origin: ["https://sketch.vaibz.xyz"],
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(express.json());

app.use("/auth", authRouter);
app.use("/room", roomRouter);
app.get("/", (req, res) => {
  res.send("Server is running ");
});

app.listen(3001, () => {
  console.log("server is running");
});
