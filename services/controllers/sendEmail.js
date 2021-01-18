require('dotenv').config();
const AWS = require("aws-sdk");
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const config = require('../../jwt/jwtConfig');

//database
const { development } = require('../../knexfile');
const knex = require("knex")(development);


exports.emailViaAWS_SES = async(req, res, next) => {
    console.trace(req.body); //req.body.messageBody (.subject, .message)
    console.trace(req.body.profileId) //!parseInt?

    try {
    
    //decode requester id
    let requester = jwt.verify(req.body.accessToken, config.jwtSecret)
    console.trace(requester.id);
    
        let requesterData = await knex('users').select('full_name','email').where('id', requester.id);
        let profileUserData = await knex('users').select('full_name','email').where('id', parseInt(req.body.profileId));
        
        let requesterName = requesterData[0].full_name;
        let requesterEmail = requesterData[0].email;
        let profileUserName = profileUserData[0].full_name;
        let profileUserEmail = profileUserData[0].email;
        let portfolioDomain = process.env.FRONTEND_DOMAIN;

    AWS.config.update({
        accessKeyId: process.env.AWS_accessKeyId,
        secretAccessKey: process.env.AWS_secretAccessKey,
        region: process.env.AWS_region
    });
    
    const ses = new AWS.SES({ apiVersion: "2010-12-01" });
    const params = {
      Destination: {
        ToAddresses: [profileUserEmail] // Email address/addresses that you want to send your email
      },
      Message: {
        Body: {
          Html: {
            // HTML Format of the email
            Charset: "UTF-8",
            Data:
                `<html>
                    <body>
                    <p>Dear ${profileUserName},</p>
                    <p>Portfol.io User <a href="${portfolioDomain}/profile/${requester.id}" target="_blank" style="color:#000"><strong>${requesterName}</strong></a> 
                    came across your profile on Portfol.io and has sent you the following message: </p>
                    <div style="margin: 2em; padding: 2em; background-color: #f5f5f5; width: 60%; border-radius: 20px">
                    <h3><b>${req.body.messageBody.subject}</b></h3>
                    <p>${req.body.messageBody.message}<br/></p>
                    </div>
                    <p>Please click <a href="mailto:${requesterEmail}" style="color:#000">here</a> to reply to ${requesterName}, or click <a href="${portfolioDomain}/logIn" target="_blank" style="color:#000">here</a> to log into your Portfol.io account. </p></br></br>
                <p>Thank you for using our services.<br />
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

    //For Sender
    const params1 = {
      Destination: {
         ToAddresses: [requesterEmail] // Email address/addresses that you want to send your email
      },
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: `<html><body>
                <h3> The following message was sent on your behalf by Portfol.io </h3><br />
                <p style="color:#535353"><b>Message sent to: </b><a href="${portfolioDomain}/profile/${req.body.profileId}" target="_blank" style="color:#000">${profileUserName} </a><br /></p>
                <p style="color:#535353"><b>Message sent: </b> <div style="margin: 0 2em">${params.Message.Body.Html.Data}</div></p>
                <p>Thank you for using our services.<br /><br/>
                Your Portfol.io Team <br/>

                </body></html>`
          }, 
          Text: {
           Charset: "UTF-8",
           Data: "Feedback Message from Portfol.io"
          }
        },
        Subject: {
         Charset: "UTF-8",
         Data: "Feedback Message from Portfol.io"
        }
     },
     Source: "Portfol.io" + process.env.AWS_SenderEmailId
   };

    const sendEmailReceiver = ses.sendEmail(params).promise();
    const sendEmailSender = ses.sendEmail(params1).promise();
    
    sendEmailReceiver
      .then(data => {
        console.trace("email submitted to SES", data);
        sendEmailSender.then(data => {
            console.trace("email submitted to SES", data);
            res.status(200).send({
                message:'Message send successfully !'
            })
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