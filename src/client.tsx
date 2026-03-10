/**
 * Name: Kabir Sheikh
 * Intent: Professional mounting for React 19. 
 * I've added a safety check to ensure the root element exists before rendering, 
 * preventing the white-screen crash observed during the Agent handshake.
 */
import "./styles.css";
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./app";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Failed to find the root element. Check index.html.");
}

const root = createRoot(container);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);