let users = [] // holds all connected users

let liveOnlineClasses = {}


const sockets = (io) => {

    // emit an event to send all active users from a class
    const emitActiveUsers = (classroomId, roomActiveUsers) => {
        io.to(classroomId).emit('class_active_users', roomActiveUsers);
    }

    // retrieve all users in a class
    const getAllClassroomUsers = classroomId => {
        // currently active sockets/users in the room
        const activeRoomSockets = io.sockets.adapter.rooms[classroomId];


        let roomActiveUsers = []
        if (io.sockets.adapter.rooms[classroomId]) {
            // for each currently active socket in the room
            // select only those users who have joined in the room and
            // push the full user information to the roomActiveUsers array
            Object.keys(activeRoomSockets.sockets).forEach(activeSocket => {
                users.forEach(user => {
                    if (user.socket === activeSocket) {
                        roomActiveUsers.push(user);
                    }
                })
            })
            emitActiveUsers(classroomId, roomActiveUsers);

        } else {
            emitActiveUsers(classroomId, []);
        }


    }

    io.on("connection", (socket) => {

        socket.on('user_online', joinedUser => {
            // if there already are online users, check if the user exists in the existing users array
            // seems like dumb logic, but if removed, can't emit active users in a classroom belo, ugh
            if (users.length > 0) {
                users.forEach(user => {
                    if (user.email !== joinedUser.email) {
                        users.push({
                            email: joinedUser.email,
                            avatar: joinedUser.avatar,
                            name: joinedUser.name,
                            socket: socket.id
                        })

                    }
                })
            } else {
                // if there are no existing users, push the new user in the array
                users.push({
                    email: joinedUser.email,
                    avatar: joinedUser.avatar,
                    name: joinedUser.name,
                    socket: socket.id
                })
            }
        })

        socket.on('class_streaming_started', payload => {
            const { classroomName, classroomId, classroomTeacher } = payload;
            io.emit('class_has_started', { classroomName, classroomId });
            socket.join(classroomId);
            emitActiveUsers(classroomId)
        })

        socket.on('join_class', ({ classroomId, isClassroomTeacher }) => {
            // currently active sockets/users in the room
            const activeRoomSockets = io.sockets.adapter.rooms[classroomId];

            // console.log(activeRoomSockets, socket.id)
            // if (activeRoomSockets && !(socket.id in activeRoomSockets.sockets))
            socket.join(classroomId);


            getAllClassroomUsers(classroomId)


        })

        socket.on('get_all_online_users', (classroomId) => {
            getAllClassroomUsers(classroomId)
        })

        socket.on('leave_classroom', (classroomId) => {
            socket.leave(classroomId)
            emitActiveUsers(classroomId)
        })

        socket.on('disconnect', () => {
            users = users.filter(user => user.socket !== socket.id)
        })


        socket.on('set_classroom_live_stream', ({ classroomId, stream }) => {

            // liveOnlineClasses[classroomId].stream = stream;
        })

        socket.on('get_class_live_stream', ({ classroomId }) => {
            if (liveOnlineClasses[classroomId]) {

                io.to(classroomId).emit("receive_class_live_stream", liveOnlineClasses[classroomId].stream)
            }
        })



        // Whiteboard Drawing
        socket.on("someone_drew", ({ classroomId, drawing }) => {
            io.to(classroomId).emit('drawing_data', drawing);
        })


        // Chat System
        socket.on('message_sent', ({ classroomId, message }) => {
            io.to(classroomId).emit('message_received', message)
        })

        socket.on('someoneIsTyping', message => {
            io.to(message.classroomId).emit('someone_is_typing', message);
        })

    })
}

module.exports = sockets;