// INFO:  this is a configuration file providing details about the IMAP and SMTP server(s) that
// the server will connect to and where that info will be stored

// imports needed to read stored info (in serverInfo.json) about the servers
// import node path module
const path = require("path");
// import file system module
const fs = require("fs");


// define interface for server information
export interface IServerInfo {
  smtp : {
    host: string,
    port: number,
    auth: {
      user: string,
      pass: string
    }
  },
  imap : {
    host: string,
    port: number,
    auth: {
      user: string,
      pass: string
    }
  }
}


// the configured server info.
export let serverInfo: IServerInfo;


// read in the server information file (serverInfo.json)
// create object that adheres to IServeInfo interface and that the ServerInfo variable points to
// file is read in as a plain string
const rawInfo: string = fs.readFileSync(path.join(__dirname, "../serverInfo.json"));
// parse string to an object and assign to serverInfo - thereby creating an object in memory that
// contains info needed to connect to the server
serverInfo = JSON.parse(rawInfo);
console.log("ServerInfo: ", serverInfo);
