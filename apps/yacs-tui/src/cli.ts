#!/usr/bin/env node
import React from "react";
import { render } from "ink";
import App from "./components/App.js";

const apiUrl = process.env.YACS_API_URL || "http://localhost:3000";
render(React.createElement(App, { apiUrl }));
