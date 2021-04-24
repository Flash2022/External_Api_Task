const express = require('express');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('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')//'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');
const path = require('path')
const fs = require("fs");

const port = process.env.PORT || 3000;

//engine
const app = express();


//Middleware
app.use(express.json());

function stringTemplateParser(expression, valueObj) {
    const templateMatcher = /{\s?([^{}\s]*)\s?}/g;
    let text = expression.replace(templateMatcher, (substring, value, index) => {
      value = valueObj[value];
      return value;
    });
    return text
  }

  app.get("/", (req, res) => {
    res.send("Hello");
  });

// api Routes
app.post('/api', async (req, res) => {
    if (!req.body) return res.sendStatus(400);
    else {
        //for loop
        const successmap = new Map();
        const failuremap = new Map();
        const promises = [];
        const array = [];
        let typea = 'application/pdf';
        
        //creating attachments array
        for (let i = 0; i < req.body.attachments.length; i++) {
            const initial_path = req.body.attachments[i].path;
            const final_path = initial_path.substr(12);
            const n = final_path.lastIndexOf("'");
            const final = final_path.substr(0, n);
            const pathToAttachment = `${__dirname}${final}`;
            if (path.extname(final) == '.png') {
                typea = 'image/png';
            }
            const attachment = fs.readFileSync(pathToAttachment).toString("base64");
            const together = {
                content: attachment,
                type: `${typea}`,
                filename: req.body.attachments[i].filename,

            };
            array.push(together)

        }
        // send mails
        for (let i = 0; i < req.body.userData.length; i++) {
            const email = req.body.userData[i].email;
            
            if (successmap.has(email) || failuremap.has(email)) {
                continue;
            } else {

                
                var name = req.body.userData[i].name;
                const status = req.body.userData[i].status;
                const type = req.body.userData[i].type;
                
                var Message = req.body.emailMessage;
                const qwerty = stringTemplateParser(Message, {name: name, status:status});
               
                //let cc = '';
                //let bcc ='';
                if (type == "cc") {
                    cc = email;
                } else if (type == "bcc") {
                    bcc = email;
                }
                //constructing message
                const msg = {
                    name: name,
                    status: status,
                    to: email,
                    from: {
                        name: 'Tarun Singh',
                        email: 'tarun.singh2376@gmail.com'
                    },
                    //cc: '',
                    //bcc: '',
                    subject: 'Result',
                    content: [{
                        type: "text/html",
                        value: qwerty
                    }],
                    attachments: array

                };

                //console.log(msg)
                // sending Mail
                promises.push(
                    await sgMail.send(msg, (err, info) => {
                        if (err) {
                            failuremap.set(email, name);
                            //console.log(err)

                        } else {

                            successmap.set(email, name);
                        }
                    }).catch(() => {
                        console.log("didnt run");
                    })
                );
            }

        }
     
        Promise.all(promises)
            .then(() => {
                let key_s = Array.from(successmap.keys());
                let keyf = Array.from(failuremap.keys());
                console.log("Success:" + key_s);
                console.log("Failure:" + keyf);
                const respond_api = {
                    status: 200,
                    message: "Task:1 - Completed.",
                    data: {
                        success: key_s,
                        failure: keyf,
                    }
                }

                res.send(respond_api)
            }
            )
            .catch(() => {
                console.log("Promise error");
            });

    }
});

//Listening
app.listen(port, () => {
    console.info(`Server started listening. at ${port}`);
   });
