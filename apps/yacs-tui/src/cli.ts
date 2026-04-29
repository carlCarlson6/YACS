#!/usr/bin/env node
import React from "react";
import { render } from "ink";
import meow from "meow";
import App from "./components/App.js";

const cli = meow(
  `
  Usage
    $ yacs <command> [options]

  Commands
    projects list                    List all projects
    deploy <project-dir>             Deploy a project (runs lint → test → build, then uploads)
    revert <deployment-id>           Revert to previous deployment
    project update <id> [options]    Update project name or status

  Options
    --api-url  YACS API URL  [default: http://localhost:3000]

  Examples
    $ yacs projects list
    $ yacs deploy ./my-vite-app
    $ yacs revert abc-123-def
    $ yacs project update proj-1 --name "New Name" --status stopped
`,
  {
    importMeta: import.meta,
    flags: {
      apiUrl: {
        type: "string",
        default: process.env.YACS_API_URL || "http://localhost:3000",
      },
    },
  },
);

render(React.createElement(App, { cli }));
