const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const redis = require("redis");
const cors = require("cors");
const RedisStore = require("connect-redis").default;
const {
  MONGO_USER,
  MONGO_PASSWORD,
  MONGO_IP,
  MONGO_PORT,
  REDIS_IP,
  REDIS_PORT,
  SESSION_SECRET,
} = require("./config/config");

const redisUrl = `redis://${REDIS_IP}:${REDIS_PORT}`

// Initialize client.
let redisClient = redis.createClient({
  url: redisUrl
});

redisClient.connect().catch(console.error)

// Initialize store.
let redisStore = new RedisStore({
  client: redisClient,
  prefix: "myapp:",
});


const postRouter = require("./routes/postRoutes");
const userRouter = require("./routes/userRoutes");

const app = express();
const mongoURL = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_IP}:${MONGO_PORT}?authSource=admin`;
const PORT = process.env.PORT || 3000;

const connectWithRetry = () => {
  mongoose
    .connect(mongoURL)
    .then(() => {
      console.log("Database connected successfully!!");
    })
    .catch((err) => {
      console.log(err);
      setTimeout(connectWithRetry, 5000); // retrying to connect to the database every 5s if it doesn't
    });
};

connectWithRetry();

app.enable("trust proxy");
app.use(cors({
  origin: "*",
}));
app.use(
  session({
    store: redisStore,
    secret: SESSION_SECRET,
    resave:false,
    saveUninitialized:false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 60000, // 1min for age of the cookie
    },
  })
);

app.get("/api/v1", (req, res) => {
  res.send("<h2>Hello from Server</h2>");
  console.log("Yeah it ran...");
});

app.use(express.json());

app.use("/api/v1/posts", postRouter);
app.use("/api/v1/users", userRouter);

app.listen(PORT, () => {
  console.log(`Server is up and listening on port: ${PORT}!!`);
});
