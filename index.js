const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const socket = require("socket.io");

const PORT = process.env.PORT || 3000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/virtualclassroom";

// import sockets
const { sockets } = require("./sockets/socket");
const chatSockets = require("./sockets/chatSocket");

const app = express();
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const io = socket(server);

sockets(io);
chatSockets(io);

app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use(bodyParser.json());
app.use(cors());

// Controllers
const UserController = require("./controllers/UserController");
const ClassController = require("./controllers/ClassController");
const NotificationController = require("./controllers/NotificationController");
const ResourceController = require("./controllers/ResourceController");
const VideoController = require("./controllers/VideoController");
const ChatController = require("./controllers/ChatMessageController");
const ResourceFolderController = require("./controllers/ResourceFolderController");
const AnnouncementController = require("./controllers/AnnouncementController");
const AssignmentController = require("./controllers/AssignmentController");

app.use("/api/user", UserController);
app.use("/api/class", ClassController);
app.use("/api/resource", ResourceController);
app.use("/api/notification", NotificationController);
app.use("/api/video", VideoController);
app.use("/api/chat", ChatController);
app.use("/api/resourceFolder", ResourceFolderController);
app.use("/api/announcement", AnnouncementController);
app.use("/api/assignment", AssignmentController);

// make uploads folder available for public access
app.use("/uploads", express.static("uploads"));

mongoose.set("useFindAndModify", false);
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Mongodb Connected");
  })
  .catch((err) => console.log("error ", err));
