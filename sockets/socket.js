const Class = require("../models/ClassModel");
const User = require("../models/UserModel");

let users = []; // holds all online users in a class
let allActiveUsers = []; // holds all the online users

let peers = {};

let typingUsers = {};

let liveOnlineClasses = {};
// let notificationRecipients = [];

// const setNotificationRecipients = (recipients) => {
//     notificationRecipients = recipients;
// }

function sockets(io) {
  // emit an event to send all active users from a class
  const emitActiveUsers = (classroomId, roomActiveUsers) => {
    io.to(classroomId).emit("class_active_users", roomActiveUsers);
  };

  // retrieve all users in a class
  const getAllClassroomUsers = (classroomId) => {
    // currently active sockets/users in the room
    const activeRoomSockets = io.sockets.adapter.rooms[classroomId];

    let roomActiveUsers = [];
    if (io.sockets.adapter.rooms[classroomId]) {
      // for each currently active socket in the room
      // select only those users who have joined in the room and
      // push the full user information to the roomActiveUsers array
      Object.keys(activeRoomSockets.sockets).forEach((activeSocket) => {
        users.forEach((user) => {
          if (user.socket === activeSocket) {
            roomActiveUsers.push(user);
          }
        });
      });
      emitActiveUsers(classroomId, roomActiveUsers);
    } else {
      emitActiveUsers(classroomId, []);
    }
  };

  io.on("connection", (socket) => {
    // fired when a user reaches the dashboard on the frontend
    socket.on("user_is_online", (user) => {
      // if the allActiveUsers array is empty, i.e. only one user is currently online,
      // push it into the array
      if (allActiveUsers.length == 0) {
        user.socket = socket.id;
        allActiveUsers.push(user);
      }
      // if there is already at least one active users, check if this socket is already present
      else if (allActiveUsers.length > 0) {
        if (allActiveUsers.find((user) => user.socket === socket.id) == undefined) {
          user.socket = socket.id;
          allActiveUsers.push(user);
        }
      }
    });

    socket.on("user_online", (joinedUser) => {
      // if there already are online users, check if the user exists in the existing users array
      // seems like dumb logic, but if removed, can't emit active users in a classroom below, ugh
      if (users.length > 0) {
        users.forEach((user) => {
          if (user.email !== joinedUser.email) {
            users.push({
              email: joinedUser.email,
              avatar: joinedUser.avatar,
              name: joinedUser.name,
              socket: socket.id,
            });
          }
        });
      } else {
        // if there are no existing users, push the new user in the array
        users.push({
          email: joinedUser.email,
          avatar: joinedUser.avatar,
          name: joinedUser.name,
          socket: socket.id,
        });
      }
    });

    socket.on("class_streaming_started", (payload) => {
      const { classroomName, classroomId, classroomTeacher, classroomImage, startTime, teacherId } = payload;
      io.emit("class_has_started", { classroomName, classroomId, teacherId });
      socket.join(classroomId);
      emitActiveUsers(classroomId);
      liveOnlineClasses.classroomId = {
        classroomName,
        classroomId,
        classroomTeacher,
        classroomImage,
        startTime,
      };
      getAllClassroomUsers(classroomId);
    });

    socket.on("join_class", ({ classroomId, isClassroomTeacher }) => {
      // currently active sockets/users in the room
      const activeRoomSockets = io.sockets.adapter.rooms[classroomId];

      typingUsers[classroomId] = { users: [] };

      // console.log(activeRoomSockets, socket.id)
      // if (activeRoomSockets && !(socket.id in activeRoomSockets.sockets))
      socket.join(classroomId);

      getAllClassroomUsers(classroomId);
    });

    socket.on("get_all_online_users", (classroomId) => {
      getAllClassroomUsers(classroomId);
    });

    socket.on("leave_classroom", (classroomId) => {
      socket.leave(classroomId);
      emitActiveUsers(classroomId);
    });

    socket.on("set_classroom_live_stream", ({ classroomId, stream }) => {
      // liveOnlineClasses[classroomId].stream = stream;
    });

    socket.on("get_class_live_stream", ({ classroomId }) => {
      if (liveOnlineClasses[classroomId]) {
        io.to(classroomId).emit("receive_class_live_stream", liveOnlineClasses[classroomId].stream);
      }
    });

    // retrieve all live online classes
    socket.on("get_all_live_classes", async ({ userId }) => {
      // get the user details
      const user = await User.findById(userId);

      // classes joined by the user
      const allClasses = user.joinedClasses;

      // filter out only those online classes in which the user has joined
      const activeOnlineClasses = Object.values(liveOnlineClasses).filter((onlineClass) => allClasses.indexOf(onlineClass.classroomId) > -1);

      io.to(socket.id).emit("all_live_classes", activeOnlineClasses);
      // console.log(activeOnlineClasses)
    });

    // --------------------------------------------------------------- //
    // Simple Peer
    // --------------------------------------------------------------- //

    socket.on("initialiseClass", (data) => {
      peers[socket.id] = { ...data, socket };
      // const activeRoomSockets = io.sockets.adapter.rooms[classroomId];
      // console.log(activeRoomSockets.sockets);
      // for (let id in peers) {
      //   if (id == socket.id) continue;
      //   peers[id].emit("initReceive", socket.id);
      // }
    });

    socket.on("teacherAddAnotherStream", (data) => {
      peers[socket.id] = { ...data, socket };
      for (let id in peers) {
        if (id == socket.id) continue;
        peers[id].socket.emit("initReceive", socket.id);
      }
    });
    socket.on("studentJoinClass", (data) => {
      peers[socket.id] = { ...data, socket };
      // const activeRoomSockets = io.sockets.adapter.rooms[classroomId];
      // console.log(activeRoomSockets.sockets);
      for (let id in peers) {
        if (id == socket.id) continue;
        peers[id].socket.emit("initReceive", socket.id);
      }
    });

    socket.on("signal", (data) => {
      if (!peers[data.socketId]) return;

      peers[data.socketId].socket.emit("signal", {
        socketId: socket.id,
        signal: data.signal,
      });
    });

    socket.on("initSend", (init_socket_id) => {
      peers[init_socket_id].socket.emit("initSend", socket.id);
    });

    // --------------------------------------------------------------- //
    //      End Simple Peer
    // --------------------------------------------------------------- //

    // Whiteboard Drawing
    socket.on("someone_drew", ({ classroomId, drawing }) => {
      io.to(classroomId).emit("drawing_data", drawing);
    });

    // Chat System
    socket.on("message_sent", ({ classroomId, message }) => {
      io.to(classroomId).emit("message_received", message);
    });

    socket.on("someoneIsTyping", ({ classroomId, user }) => {
      if (typingUsers[classroomId].users.indexOf(user) == -1) {
        typingUsers[classroomId].users.push(user);
      }
      io.to(classroomId).emit("someone_is_typing", typingUsers[classroomId].users);
    });

    socket.on("notTyping", ({ classroomId, user }) => {
      if (typingUsers[classroomId].users.indexOf(user) > -1) {
        typingUsers[classroomId].users.splice(typingUsers[classroomId].users.indexOf(user), 1);
        io.to(classroomId).emit("someone_is_typing", typingUsers[classroomId].users);
      }
    });

    // code editor
    socket.on("code_editor_typing", (data) => {
      io.to(data.classroomId).emit("code_editor_typing", data);
    });

    // Notification System

    // send notifications to relevant recipients when new notification is created
    socket.on("new_notification", async ({ classId, notification }) => {
      const classroom = await Class.findById(classId).populate("createdBy");
      const classroomTeacher = classroom.createdBy.name;
      const className = classroom.name;
      let notificationContent = "";

      if (notification.type === "RESOURCE_CREATED") {
        notificationContent = `${classroomTeacher} has added a new file in ${className}`;
      }

      const intendedRecipients = classroom.users;
      let recipientsSockets = [];

      // console.log(allActiveUsers)

      for (let i = 0; i < allActiveUsers.length; i++) {
        for (j = 0; j < intendedRecipients.length; j++) {
          // console.log(allActiveUsers[i].userId, intendedRecipients[j])
          // each item in intendedRecipients is an object, so convert it to string
          if (allActiveUsers[i].userId === String(intendedRecipients[j])) {
            recipientsSockets.push(allActiveUsers[i].socket);
          }
        }
      }

      recipientsSockets = recipientsSockets.filter((recipient) => recipient !== socket.id);

      if (recipientsSockets.length > 0) {
        recipientsSockets.forEach((recipient) => {
          io.to(recipient).emit("new_notification", notificationContent);
        });
      }
    });

    socket.on("disconnect", () => {
      // remove disconnected users from the array
      users = users.filter((user) => user.socket !== socket.id); //need to remove this line later, TODO
      allActiveUsers = allActiveUsers.filter((user) => user.socket !== socket.id);
    });
  });
}

module.exports = { sockets, liveOnlineClasses, users };
