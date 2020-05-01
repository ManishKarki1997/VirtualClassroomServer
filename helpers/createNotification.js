// import Class from '../models/ClassModel';
// import Notification from '../models/NotificationModel';
// import User from '../models/UserModel';


// const createNotification = async ({ title, content, classId, createdBy }) => {
//     try {
//         const notification = new Notification({
//             title,
//             content,
//             classId,
//             createdBy
//         })

//         const result = await notification.save();

//         const theClass = await Class.findById(classId);
//         theClass.notifications.push(result._id);
//         await theClass.save();

//         return {
//             error: false,
//             payload: { result }
//         }
//     } catch (error) {
//         console.log(error)
//         return {
//             error: true,
//             message: error
//         }
//     }
// }

// module.exports = createNotification;