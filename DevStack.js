#!/usr/bin/env node
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import url from "url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const projectName = process.argv[2] || "mern-app";
const projectPath = path.join(process.cwd(), projectName);

function runCommand(command, cwd = projectPath) {
  console.log(`\n▶️ Running: ${command}`);
  execSync(command, { stdio: "inherit", cwd });
}

// Step 1: Create main directory
if (!fs.existsSync(projectPath)) {
  fs.mkdirSync(projectPath);
}
console.log(`📂 Created project folder: ${projectName}`);

// --- CLIENT with Vite (React + JS) ---
console.log("⚡ Setting up Vite + React client...");
runCommand(`npx --yes create-vite@latest client --template react`, projectPath);
runCommand(`npm install`, path.join(projectPath, "client"));
runCommand(`npm install axios react-router-dom lucide-react`, path.join(projectPath, "client"));

// Install TailwindCSS with Vite plugin
console.log("🎨 Installing TailwindCSS with Vite plugin...");
runCommand("npm install tailwindcss @tailwindcss/vite", path.join(projectPath, "client"));

// --- Cleanup boilerplate ---
console.log("🧹 Cleaning boilerplate...");
const clientPath = path.join(projectPath, "client");
const filesToDelete = [
  "src/assets/react.svg",
  "src/App.css",
  "src/index.css"
];
filesToDelete.forEach(file => {
  const fPath = path.join(clientPath, file);
  if (fs.existsSync(fPath)) fs.rmSync(fPath, { force: true });
});

// Replace App.jsx with Tailwind demo
fs.writeFileSync(path.join(clientPath, "src/App.jsx"), `
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function Home() {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold text-blue-600">Hello MERN 🚀</h1>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  );
}
`);

// Replace main.jsx
fs.writeFileSync(path.join(clientPath, "src/main.jsx"), `
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`);

// Create Tailwind entry CSS file
fs.writeFileSync(path.join(clientPath, "src/index.css"), `
@import "tailwindcss";
`);

// Update vite.config.js to enable Tailwind plugin
const viteConfigPath = path.join(clientPath, "vite.config.js");
let viteConfig = fs.readFileSync(viteConfigPath, "utf-8");
viteConfig = viteConfig.replace(
  `import react from '@vitejs/plugin-react'`,
  `import react from '@vitejs/plugin-react'\nimport tailwindcss from '@tailwindcss/vite'`
);
viteConfig = viteConfig.replace(
  "plugins: [react()]",
  "plugins: [react(), tailwindcss()]"
);
fs.writeFileSync(viteConfigPath, viteConfig);

console.log("✅ Client setup complete with React, Router, Axios, Lucide, and TailwindCSS!");

// --- SERVER Setup ---
console.log("🛠 Setting up Express server...");
const serverPath = path.join(projectPath, "server");
if (!fs.existsSync(serverPath)) fs.mkdirSync(serverPath);

// Init npm + install server-side dependencies
runCommand("npm init -y", serverPath);
runCommand(
  "npm install express cors mongoose bcryptjs jsonwebtoken axios",
  serverPath
);
runCommand("npm install --save-dev nodemon", serverPath);

// Modify server package.json
const serverPkgPath = path.join(serverPath, "package.json");
const serverPkg = JSON.parse(fs.readFileSync(serverPkgPath));
serverPkg.type = "module";
serverPkg.scripts = {
  start: "node index.js",
  dev: "nodemon index.js",
};
fs.writeFileSync(serverPkgPath, JSON.stringify(serverPkg, null, 2));

// Create necessary server folders
["controllers", "models", "routes", "middlewares"].forEach((dir) =>
  fs.mkdirSync(path.join(serverPath, dir))
);

// Create .env file for server configuration
fs.writeFileSync(
  path.join(serverPath, ".env"),
  `PORT=5000
MONGO_URI=your_mongodb_connection
JWT_SECRET=supersecretkey
`
);

// Create index.js file for server
fs.writeFileSync(
  path.join(serverPath, "index.js"),
  `import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("🚀 MERN server running...");
});

const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    app.listen(PORT, () => console.log(\`✅ Server running on port \${PORT}\`));
  })
  .catch((err) => console.error("❌ DB Connection Error:", err));
`
);

console.log("✅ MERN setup complete!");

console.log(`
Next steps:
1. cd ${projectName}
2. cd client && npm run dev   → start React frontend
3. cd server && npm run dev   → start backend with nodemon
4. For production: npm run start (server)
`);
