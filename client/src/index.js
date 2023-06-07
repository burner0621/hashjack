import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// hashpack
import HashConnectProvider from "assets/api/HashConnectAPIProvider.tsx";
import { HashConnect } from "hashconnect";
const hashConnect = new HashConnect(true);

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <HashConnectProvider hashConnect={hashConnect} debug>
    <App />
  </HashConnectProvider>
);
