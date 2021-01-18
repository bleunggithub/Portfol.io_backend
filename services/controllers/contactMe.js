require('dotenv').config();
const AWS = require("aws-sdk");
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const config = require('../../jwt/jwtConfig');


exports.emailViaAWS_SES = async(req, res, next) => {
    console.trace(req.body); 

  try {
      
    const {name, email, body} = req.body.message

    AWS.config.update({
        accessKeyId: process.env.AWS_accessKeyId,
        secretAccessKey: process.env.AWS_secretAccessKey,
        region: process.env.AWS_region
    });
    
    const ses = new AWS.SES({ apiVersion: "2010-12-01" });
    const params = {
      Destination: {
        ToAddresses: ['leungcheukkei@gmail.com'] // Email address/addresses that you want to send your email
      },
      Message: {
        Body: {
          Html: {
            // HTML Format of the email
            Charset: "UTF-8",
            Data:
                `<html>
                    <body>
                    <p>Hello,</p>
                    <p>You have received a message from your web app Portfol.io. </p>
                    <div style="margin: 2em; padding: 2em; background-color: #f5f5f5; width: 60%; border-radius: 20px">
                    <p>Name: ${name}</p>
                    <p>Email: ${email}</p>
                    <p>Message: ${body}<br/></p>
                    </div>
                    <p>Click <a href="mailto:${email}" style="color:#000">here</a> to reply to ${name}.<br />
                Your Portfol.io Team <br/>
                <img src="https://i.imgur.com/TXykstZ.png" style="margin: 1em; width: 80px; height: 80px"></p>
                    </body>
                </html>`
          },
          Text: {
            Charset: "UTF-8",
            Data: "Someone Sent You a Message on Portfol.io!"
          }
        },
        Subject: {
          Charset: "UTF-8",
          Data: "Someone Sent You a Message on Portfol.io!"
        }
      },
      Source: "Portfol.io" + process.env.AWS_SenderEmailId
    };

    const sendEmailReceiver = ses.sendEmail(params).promise();
    
    sendEmailReceiver
      .then(data => {
        console.trace("email submitted to SES", data);
            res.status(200).send({
                message:'Message send successfully !'
            }).catch(error => {
            console.trace(error);
            res.status(404).send({
                message:'Failed to send !'
            })
        });
      })
      .catch(error => {
        console.trace(error);
        res.status(404).send({
            message:'Failed to send !'
        })
    });        

    } catch (err) {
        console.trace(err)
        res.status(400)
    }

 

    
}