import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const buildDir = process.env.UX_BUILD_DIR || "build";
const port = Number(process.env.UX_PORT || "4173");
const outDir = process.env.UX_OUT_DIR || "ux-captures";
const baseUrl = process.env.UX_BASE_URL || `http://localhost:${port}`;

const routes = [
  { name: "login", path: "/login" },
  { name: "register", path: "/register" },
  { name: "dashboard", path: "/?demoRole=instructor" },
  { name: "students", path: "/students?demoRole=instructor" },
  { name: "student-profile", path: "/students/demo-student?demoRole=instructor" },
  { name: "lessons", path: "/lessons?demoRole=instructor" },
  { name: "lesson-details", path: "/lessons/demo-lesson-3?demoRole=instructor" },
  { name: "book-lesson", path: "/book-lesson?demoRole=instructor" },
  { name: "messages", path: "/messages?demoRole=instructor" },
  { name: "conversation", path: "/messages/demo-student?demoRole=instructor" },
  { name: "calendar", path: "/calendar?demoRole=instructor" },
  { name: "waiting-list", path: "/waiting-list?demoRole=instructor" },
  { name: "earnings", path: "/earnings?demoRole=instructor" },
  { name: "tips", path: "/tips?demoRole=instructor" },
  { name: "notifications", path: "/notifications?demoRole=instructor" },
  { name: "pricing", path: "/pricing?demoRole=instructor" },
  { name: "car-details", path: "/car-details?demoRole=instructor" },
  { name: "profile", path: "/profile?demoRole=instructor" },
  { name: "student-report", path: "/students/demo-student/report?demoRole=instructor" },
  { name: "lesson-invoice", path: "/lessons/demo-lesson-3/invoice?demoRole=instructor" },
  { name: "student-dashboard", path: "/student-dashboard?demoRole=student" },
  { name: "student-lessons", path: "/my-lessons?demoRole=student" },
  { name: "student-messages", path: "/my-messages?demoRole=student" }
];

async function capture() {
  fs.mkdirSync(outDir, { recursive: true });

  const server = await startServer(buildDir, port);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  for (const route of routes) {
    const url = new URL(route.path, baseUrl).toString();
    await page.goto(url, { waitUntil: "networkidle" });
    await page.addStyleTag({
      content: "* { animation: none !important; transition: none !important; }"
    });
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(outDir, `${route.name}.png`),
      fullPage: true
    });
  }

  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

capture().catch((error) => {
  console.error(error);
  process.exit(1);
});

function startServer(root, listenPort) {
  const mime = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".ico": "image/x-icon"
  };

  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const rawPath = (req.url || "/").split("?")[0];
      const safePath = decodeURIComponent(rawPath);
      let filePath = path.join(root, safePath);

      if (safePath.endsWith("/")) {
        filePath = path.join(filePath, "index.html");
      }

      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(root, "index.html");
      }

      const ext = path.extname(filePath).toLowerCase();
      res.setHeader("Content-Type", mime[ext] || "application/octet-stream");
      fs.createReadStream(filePath).pipe(res);
    });

    server.listen(listenPort, () => resolve(server));
  });
}
