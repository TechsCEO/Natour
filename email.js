const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');
const catchAsync = require('./utils/catchAsync');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Seyyed Mahdi Hussaini <${process.env.EMAIL_FROM}>`;
  }


  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD
        }
      });
    }
    /*console.log('Node Env Is :', process.env.NODE_ENV);
    console.log('MAIL_HOST Is :', process.env.MAIL_HOST);
    console.log('POR Env Is :', process.env.EMAIL_POR);
    console.log('EMAIL_USERNAME Env Is :', process.env.EMAIL_USERNAME);
    console.log('EMAIL_PASSWORD Env Is :', process.env.EMAIL_PASSWORD);*/

    return nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.EMAIL_POR,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // Send the actual email
  async send(template, subject) {
    // 1) Render HTML base on a pug template
    console.log('Template Is : ', template);
    const html = pug.renderFile(`${__dirname}/views/emails/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject
    });
    console.log('Subject Is : ', subject);

    // 2) Define email option
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html)
    };
    console.log('After Mail Options!');

    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours family');
  }

  async sendPasswordReset() {
    await this.send('passwordReset', 'Your password reset token (Valid for 10 min)');
  }
};


/*const sendEmail = async options => {
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.EMAIL_POR,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  // 2) Define Email Option
  const mailOptions = {
    from: 'Seyyed Mahdi Hussaini',
    to: options.mail,
    subject: options.subject,
    text: options.message
  };

  await transporter.sendMail(mailOptions);
};
module.exports = sendEmail;*/


// We do not use gmail because you only can send 500 mail pai day
// more than that you will be marked as spammer