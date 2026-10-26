// import nodemailer from "nodemailer";

// const testAccount = await nodemailer.createTestAccount();

// const transporter = nodemailer.createTransport({
//     host: 'smtp.ethereal.email',
//     port: 587,
//     auth: {
//         user: 'arjun.tremblay@ethereal.email',
//         pass: 'sjn9X83bW2J8w38B1p'
//     }
// });


// export const sendMail = async({to,subject, html})=>{
// try {
//   const info = await transporter.sendMail({
//     // from: '"Example Team" <team@example.com>', // sender address
//     from: testAccount.user, //random user  but for real time send auth : user email here
//     to: to, // list of recipients
//     subject: subject,
//     // text: "Hello world?", // plain text body
//     html: html
//   });

//   console.log("Message sent: %s", info.messageId);
//   // Preview URL is only available when using an Ethereal test account
//   console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
// } catch (err) {
//   console.error("Error while sending mail:", err);
// }
// }

