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
