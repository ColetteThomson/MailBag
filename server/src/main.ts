// core node module (path)
import path from "path";
import express, { Express, NextFunction, Request, Response } from "express";
// application imports:
import { serverInfo } from "./ServerInfo";
import * as IMAP from "./IMAP";
import * as SMTP from "./SMTP";
import * as Contacts from "./Contacts";
import { IContact } from "./Contacts";

//create express app
const app: Express = express();
// middleware for parsing incoming request bodies that contain json (for express app)
app.use(express.json());
// serve client code to a browser (basic web server)
app.use("/", express.static(path.join(__dirname, "../../client/dist")));

// function() is passed incoming request, generated response, and reference to next function
app.use(function(inRequest: Request, inResponse: Response, inNext: NextFunction) {
    // enable REST functions using CORS headers:
    // allows all domain requests to server
    inResponse.header("Access-Control-Allow-Origin", "*");
    // http methods accepted from clients
    inResponse.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    // Content-Type = json
    inResponse.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    // ensures continued middleware chain for Express requests
    inNext();
});

// REST endpoint: to get a LIST OF MAILBOXES
// register path
app.get("/mailboxes",
    // callback asynchronous function: passed incoming request and generated response
    async (inRequest: Request, inResponse: Response) => {
        try {
            // instantiate a IMAP.Worker object
            const imapWorker: IMAP.Worker = new IMAP.Worker(serverInfo);
            // call listMailboxes method capturing array of returned objects
            const mailboxes: IMAP.IMailbox[] = await imapWorker.listMailboxes();
            // array marshals into json and returns to caller
            inResponse.json(mailboxes);
        } catch (inError) {
            inResponse.send("error");
        }
    }
);

// REST endpoint: to get a LIST OF MESSAGES in a specific mailbox
// register path, colon indicates a dynamic value request parameter
app.get("/mailboxes/:mailbox",
    // callback asynchronous function: passed incoming request and generated response
    async (inRequest: Request, inResponse: Response) => {
        try {
            // instantiate a IMAP.Worker object
            const imapWorker: IMAP.Worker = new IMAP.Worker(serverInfo);
            // call listMessages method capturing array of returned objects
            const messages: IMAP.IMessage[] = await imapWorker.listMessages({
                // to access above dynamic value request parameter
                mailbox : inRequest.params.mailbox
            });
            // array marshals into json and returns to caller
            inResponse.json(messages);
        } catch (inError) {
            inResponse.send("error");
        }
    }
);

// REST endpoint: to get a specific message's CONTENT for a specific mailbox
// register path, colon indicates a dynamic value request parameter
app.get("/messages/:mailbox/:id",
    // callback asynchronous function: passed incoming request and generated response
    async (inRequest: Request, inResponse: Response) => {
        try {
            // instantiate a IMAP.Worker object
            const imapWorker: IMAP.Worker = new IMAP.Worker(serverInfo);
            // call getMessageBody method to return string (message content)
            // 'undefined' if message can't be found on server
            const messageBody: string | undefined = await imapWorker.getMessageBody({
                // to access above dynamic value request parameters for mailbox and message id
                mailbox : inRequest.params.mailbox,
                // convert id number to a string
                id : parseInt(inRequest.params.id, 10)
            });
            // returns to caller as plain text (or an html-based message)
            inResponse.send(messageBody);
        } catch (inError) {
            inResponse.send("error");
        }
    }
);

// REST endpoint: to DELETE A MESSAGE 
// register path, colon indicates a dynamic value request parameter
app.delete("/messages/:mailbox/:id",
    // callback asynchronous function: passed incoming request and generated response
    async (inRequest: Request, inResponse: Response) => {
        try {
            // instantiate a IMAP.Worker object
            const imapWorker: IMAP.Worker = new IMAP.Worker(serverInfo);
            // call deleteMessage method and pass to mailbox and id
            await imapWorker.deleteMessage({
                // to access above dynamic value request parameters for mailbox and message id
                mailbox : inRequest.params.mailbox,
                // convert id number to a string
                id : parseInt(inRequest.params.id, 10)
            });
            // returns to caller as plain text (or an html-based message)
            inResponse.send("ok");
        } catch (inError) {
            inResponse.send("error");
        }
    }
);

// REST endpoint: to SEND A MESSAGE
// register path
app.post("/messages",
    // callback asynchronous function: passed incoming request and generated response
    async (inRequest: Request, inResponse: Response) => {
        try {
            // instantiate a SMTP.Worker object
            const smtpWorker: SMTP.Worker = new SMTP.Worker(serverInfo);
            // call sendMessage method
            await smtpWorker.sendMessage(inRequest.body);
            // returns to caller as plain text (or an html-based message)
            inResponse.send("ok");
        } catch (inError) {
            inResponse.send("error");
        }
    }
);

// REST endpoint: to LIST CONTACTS
// register path
app.get("/contacts",
    // callback asynchronous function: passed incoming request and generated response
    async (inRequest: Request, inResponse: Response) => {
        try {
            // instantiate a Contacts.Worker object
            const contactsWorker: Contacts.Worker = new Contacts.Worker();
            // call listContacts method
            const contacts: IContact[] = await contactsWorker.listContacts();
            // array marshals into json and returns to caller
            inResponse.json(contacts);
        } catch (inError) {
            inResponse.send("error");
        }
    }
);

// REST endpoint: to ADD A CONTACT
// register path
app.post("/contacts",
    // callback asynchronous function: passed incoming request and generated response
    async (inRequest: Request, inResponse: Response) => {
        try {
            // instantiate a Contacts.Worker object
            const contactsWorker: Contacts.Worker = new Contacts.Worker();
            // call addContact method to return added contact
            const contact: IContact[] = await contactsWorker.addContact(inRequest.body);
            // array marshals into json and returns to caller
            inResponse.json(contact);
        } catch (inError) {
            inResponse.send("error");
        }
    }
);

// REST endpoint: to DELETE A CONTACT
// register path
app.delete("/contacts/:id",
    // callback asynchronous function: passed incoming request and generated response
    async (inRequest: Request, inResponse: Response) => {
        try {
            // instantiate a Contacts.Worker object
            const contactsWorker: Contacts.Worker = new Contacts.Worker();
            // call deleteContact method to delete a specific contact (id)
            await contactsWorker.deleteContact(inRequest.params.id);
            // returns to caller as plain text (or an html-based message)
            inResponse.send("ok");
        } catch (inError) {
            inResponse.send("error");
        }
    }
);
