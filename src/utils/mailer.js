import nodemailer from "nodemailer";
import {User} from "../model/user.models.js";
import bcrypt from "bcrypt";

const senderMail = process.env.EMAIL_SENDING;
const password = process.env.EMAIL_SENDING_PASS;

 const sendEmail = async ({ email, emailType, userId }) => {
  try {
    // Create a hashed token
    const hashedToken = await bcrypt.hash(userId.toString(), 10);

    if (emailType === "RESET") {
      await User.findByIdAndUpdate(userId, {
        forgotPasswordToken: hashedToken,
        forgotPasswordTokenExpiry: Date.now() + 36000000,
      });
    }

    var transport = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: senderMail,
        pass: password,
      },
    });

    const mailOptions = {
      from: senderMail,
      to: email,
      subject: "Reset Your Password",
      html: `<p>Copy paste the link below to Reset Your Password <br />
            ${process.env.DOMAIN}/resetPassword?token=${hashedToken}
            </p>`,
    };

    const mailResponse = await transport.sendMail(mailOptions);
    return mailResponse;
  } catch (error) {
    throw new Error(error.message);
  }
};

export default sendEmail