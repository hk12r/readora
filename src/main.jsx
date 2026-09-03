import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { ReadoraProvider } from "./context/ReadoraContext";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter basename="/readora">
      <ReadoraProvider>
        <App />
      </ReadoraProvider>
    </BrowserRouter>
  </React.StrictMode>
);
