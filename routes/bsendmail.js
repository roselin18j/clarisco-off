const express = require("express");
const router = express.Router();
const async = require("async");
const nodemailer = require("nodemailer");
const emailtemplate = require("../models/emailtemplate");
var fs = require("fs");

var get = function (req) {
  fs.readFile("./routes/bsmail.js", "utf-8", (err, data) => {
    if (err) {
      console.error("Unable to read SMTP configuration:", err.message);
      return;
    }

    var data_og;
    try {
      data_og = JSON.parse(data);
    } catch (parseError) {
      console.error("Invalid SMTP configuration:", parseError.message);
      return;
    }
    const smtpuser = data_og.smtpuser;
    const smtppass = data_og.smtppass;
    const smtpurl = data_og.smtphost;
    const smtpport = Number(data_og.smtpport);

    var strreplace_cnd = req.strrp_cond;
    var mapObj = req.replace_cnt;
    var identifier = req.identifier;
    var toemail = req.to;
    var emailcc = req.cc;
    var sitename = req.settings.sitename;

    emailtemplate.findOne(
      { identifier: identifier },
      { _id: 0 },
      function (err, bcdata) {
        if (err || !bcdata) {
          console.error("Email template lookup failed:", {
            identifier: identifier,
            message: err ? err.message : "template not found",
          });
          return;
        }

        var msgcnt = bcdata.content.replace(strreplace_cnd, function (matched) {
          return mapObj[matched];
        });

        var transporter = nodemailer.createTransport({
          host: smtpurl,
          port: smtpport,
          // Port 465 uses implicit TLS; port 587 starts in plaintext and upgrades with STARTTLS.
          secure: smtpport === 587,
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
          secure: false,
          requireTLS: true,
          auth: {
            user: smtpuser,
            pass: smtppass,
          },
        });

        var mailOptions = {
          from: sitename + " <" + smtpuser + ">", // sender address
          to: toemail, // list of receivers
          cc: emailcc,
          subject: bcdata.subject, // Subject line
          // text: bcdata.content, // plain text body
          html: msgcnt, // html body
        };

        transporter.sendMail(mailOptions, (error) => {
          // The calling route owns the HTTP response; mail runs in the background.
          if (error) {
            console.error("Email delivery failed:", {
              identifier: identifier,
              code: error.code,
              command: error.command,
              responseCode: error.responseCode,
              message: error.message,
              host: smtpurl,
              port: smtpport,
            });
          }
        });
      },
    );
  });
};

module.exports = router;
module.exports.get = get;
