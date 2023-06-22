// library imports
import { ParsedMail } from "mailparser";
const ImapClient = require("emailjs-imap-client");
import { simpleParser } from "mailparser";

// app imports
import { IServerInfo } from "./ServerInfo";


// define interface to describe a mailbox and optionally a specific message
// to be supplied to various methods here
export interface ICallOptions {
  mailbox: string,
  id?: number
}


// define interface to describe a received message. note: 'body' is optional as it isn't sent when listing messages
export interface IMessage {
  id: string,
  date: string,
  from: string,
  subject: string,
  body?: string
}


// define interface to describe a mailbox
export interface IMailbox {
  name: string,
  path: string
}


// disable certificate validation (less secure, but needed for some servers) -will execute when module loads
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";


// The worker that will perform IMAP operations.
export class Worker {
  // server information
  private static serverInfo: IServerInfo;
  // constructor   
  constructor(inServerInfo: IServerInfo) {
    // server info is passed to the constructor and stored
    console.log("IMAP.Worker.constructor", inServerInfo);
    Worker.serverInfo = inServerInfo;
  }


  /**
   * connect to the SMTP server and return a client object for operations to use
   * creates emailjs-imap-client object and connects it to server
   * @return An ImapClient instance
   */
  private async connectToServer(): Promise<any> {
    // noinspection TypeScriptValidateJSTypes
    // client is created
    const client: any = new ImapClient.default(
      Worker.serverInfo.imap.host,
      Worker.serverInfo.imap.port,
      // pass in a username and password
      { auth : Worker.serverInfo.imap.auth }
    );
    // to keep output when running quiet, prevents excessive logging
    client.logLevel = client.LOG_LEVEL_NONE;
    // error handler, called if connection to server can't be established
    client.onerror = (inError: Error) => {
      console.log("IMAP.Worker.listMailboxes(): Connection error", inError);
    };
    await client.connect();
    console.log("IMAP.Worker.listMailboxes(): Connected");

    return client;

  }


  /**
   * returns a list of all (top-level) mailboxes
   *
   * @return an array of objects, on per mailbox, that describes the mailbox
   */
  public async listMailboxes(): Promise<IMailbox[]> {
    console.log("IMAP.Worker.listMailboxes()");
    // get a client using connectToServer()
    const client: any = await this.connectToServer();
    // call to list mailboxes
    const mailboxes: any = await client.listMailboxes();
    // close connection (thus a new client would be constructed with each method call)
    await client.close();

    // translate from emailjs-imap-client mailbox objects to app-specific objects.  At the same time, flatten the list
    // of mailboxes via recursion (and avoid hierarchical issues).
    // for each mailbox encountered, regardless of level in hierarchy, it will be added to finalMailboxes as 
    // a new object that contains just the name and path
    const finalMailboxes: IMailbox[] = [];
    const iterateChildren: Function = (inArray: any[]): void => {
      inArray.forEach((inValue: any) => {
        finalMailboxes.push({
          name : inValue.name,
          path : inValue.path
        });
        // children property is passed to iterateChildren() to continue through hierarchy
        iterateChildren(inValue.children);
      });
    };
    iterateChildren(mailboxes.children);
    return finalMailboxes;
  }


  /**
   * lists basic information about messages in a named mailbox
   *
   * @param inCallOptions An object implementing the ICallOptions interface
   * @return              An array of objects, one per message
   */
  public async listMessages(inCallOptions: ICallOptions): Promise<IMessage[]> {

    console.log("IMAP.Worker.listMessages()", inCallOptions);

    const client: any = await this.connectToServer();

    // we have to select the mailbox first, this gives us the message count
    const mailbox: any = await client.selectMailbox(inCallOptions.mailbox);
    // 'exists' determines how many messages there are, if none then returns empty array
    console.log(`IMAP.Worker.listMessages(): Message count = ${mailbox.exists}`);

    // If there are no messages then just return an empty array.
    if (mailbox.exists === 0) {
      await client.close();
      return [ ];
    }

    // if there are messages, need to retrieve them.  note that they are returned in order by uid, so it's FIFO.
    // noinspection TypeScriptValidateJSTypes
    const messages: any[] = await client.listMessages(
      // 1st arg: takes in name of mailbox, what messages to retrieve, and what properties required
      // 2nd arg: a query that determines what messages we'll get (i.e. start with first and all messages after it)
      // 3rd arg: for each message get unique ID and its metadata ('envelope') - but not the body of the message
      inCallOptions.mailbox,
      "1:*",
      [ "uid", "envelope" ]
    );

    await client.close();

    // translate from emailjs-imap-client message objects to app-specific objects
    const finalMessages: IMessage[] = [];
    messages.forEach((inValue: any) => {
      finalMessages.push({
        id : inValue.uid,
        date: inValue.envelope.date,
        from: inValue.envelope.from[0].address,
        subject: inValue.envelope.subject
      });
    });

    return finalMessages;

  }


  /**
   * gets the plain text body of a single message - uses listMessages(), and requesting 'body' as an array
   *
   * @param  inCallOptions An object implementing the ICallOptions interface.
   * @return               The plain text body of the message.
   */
  public async getMessageBody(inCallOptions: ICallOptions): Promise<string | undefined> {
    console.log("IMAP.Worker.getMessageBody()", inCallOptions);
    const client: any = await this.connectToServer();

    // noinspection TypeScriptValidateJSTypes
    // 4th arg: tells the method we are listing messages based on their ordinal number (a unique id here)
    const messages: any[] = await client.listMessages(
      inCallOptions.mailbox,
      inCallOptions.id,
      [ "body[]" ],
      { byUid : true }
    );
    // once we have message is passed along to simpleParser()
    const parsed: ParsedMail = await simpleParser(messages[0]["body[]"]);
    // close connection
    await client.close();
    // return text property of that object (i.e. body content with concatenation of multiple body parts)
    return parsed.text;
  }


  /**
   * Deletes a single message.
   *
   * @param inCallOptions An object implementing the ICallOptions interface.
   */
  public async deleteMessage(inCallOptions: ICallOptions): Promise<any> {
    console.log("IMAP.Worker.deleteMessage()", inCallOptions);
    const client: any = await this.connectToServer();
    // pass mailbox name and unique id of message to delete
    await client.deleteMessages(
      inCallOptions.mailbox,
      inCallOptions.id,
      { byUid : true }
    );
    // close connection
    await client.close();

  }


} /* End class. */
