const nodemailer = require("nodemailer");
const pug = require("pug");
const juice = require("juice");
const htmlToText = require("html-to-text");
// const { promisify } = require("es6-promisify");
// const { promisify } = require("util");

const transport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

const generateHTML = (filename, options = {}) => {
  const html = pug.renderFile(
    `${__dirname}/../views/email/${filename}.pug`,
    options
  );
  const inlined = juice(html);
  return inlined;
};

exports.send = async options => {
  const html = generateHTML(options.filename, options);
  const text = htmlToText.fromString(html);

  const mailOptions = {
    from: '"Fred Foo 👻" <foo@example.com>',
    to: options.user.email,
    subject: options.subject,
    html,
    text
  };
  transport.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.log(error);
      return next({ status: 500, message: error.message });
    }
    console.log("Message sent: " + info.response);
  });
  // const sendMail = promisify(transport.sendMail, transport);
  // return sendMail(mailOptions);
};
