/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {
  WebSocketMessageReader,
  IWebSocket,
  WebSocketMessageWriter,
} from "vscode-ws-jsonrpc";
import {
  forward,
  createConnection,
  createServerProcess,
} from "vscode-ws-jsonrpc/lib/server";
import {
  InitializeRequest,
  InitializeParams,
  Message,
} from "vscode-languageserver";

export function launch(socket: IWebSocket) {
  const reader = new WebSocketMessageReader(socket);
  const writer = new WebSocketMessageWriter(socket);
  // start the language server as an external process
  const socketConnection = createConnection(reader, writer, () =>
    socket.dispose()
  );
  const serverConnection = createServerProcess("powershell", "powershell", [
    __dirname +
      "/PowerShellEditorServices/PowerShellEditorServices/Start-EditorServices.ps1",
    "-HostName",
    "monaco",
    "-HostProfileId",
    "0",
    "-HostVersion",
    "1.0.0",
    "-LogPath",
    __dirname + "/logs/pses.log.txt",
    "-LogLevel",
    "Diagnostic",
    "-BundledModulesPath",
    __dirname + "/PowerShellEditorServices",
    "-Stdio",
    "-SessionDetailsPath",
    __dirname + "/.pses_session",
    "-FeatureFlags",
    "@()",
  ]);

  if (serverConnection) {
    forward(socketConnection, serverConnection, (message) => {
      if (Message.isRequest(message)) {
        if (message.method === InitializeRequest.type.method) {
          const initializeParams = message.params as InitializeParams;
          initializeParams.processId = process.pid;
        }
      }
      return message;
    });
  }
}
