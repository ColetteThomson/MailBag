// INFO:  this file talks to an SMTP server to send message and will have a Worker class

// library imports
import Mail from "nodemailer/lib/mailer";
import * as nodemailer from "nodemailer";
// nodemailer: a single (no dependencies) Node module for easy email sending (use with a 'transport' object)
import { SendMailOptions, SentMessageInfo } from "nodemailer";

// app imports
import { IServerInfo } from "./ServerInfo";


// the worker that will perform SMTP operations
export class Worker {
  // instatiated server information sent, them stored in ServerInfo
  private static serverInfo: IServerInfo;
  // constructor:
  // IServerInfo contains info needed to connect to SMTP server
  constructor(inServerInfo: IServerInfo) {
    console.log("SMTP.Worker.constructor", inServerInfo);
    Worker.serverInfo = inServerInfo;
  } 


  /**
   * Send a message
   *
   * @param  inOptions An object containing to, from, subject and text properties (matches the IContact interface,
   *                   but can't be used since the type comes from nodemailer, not app code).
   * @return           A Promise that eventually resolves to a string (null for success, error message for an error).
   */
  public sendMessage(inOptions: SendMailOptions): Promise<string> {

    console.log("SMTP.Worker.sendMessage()", inOptions);

    return new Promise((inResolve, inReject) => {
      const transport: Mail = nodemailer.createTransport(Worker.serverInfo.smtp);
      transport.sendMail(
        inOptions,
        (inError: Error | null, inInfo: SentMessageInfo) => {
          if (inError) {
            console.log("SMTP.Worker.sendMessage(): Error", inError);
            inReject(inError);
          } else {
            console.log("SMTP.Worker.sendMessage(): Ok", inInfo);
            inResolve("");
          }
        }
      );
    });

  }


}
