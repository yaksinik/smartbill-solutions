import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
// @ts-ignore
import Razorpay from "razorpay";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Request logging middleware - MOVE TO TOP for visibility
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - UA: ${req.get('User-Agent')}`);
    next();
  });

  // Static files
  app.use(express.static("public", { extensions: ["html"] }));

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Razorpay Order Creation
  app.post("/api/create-order", async (req, res) => {
    try {
      const { amount } = req.body;
      
      const key_id = "rzp_test_SabcTaa0jiCIqj";
      const key_secret = "WoPU4WtTez8didmLuyKJEYjS";

      if (!key_id || !key_secret) {
        return res.status(500).json({ error: "Razorpay keys not configured" });
      }

      const razorpay = new Razorpay({
        key_id: 'rzp_test_SabcTaa0jiCIqj',
        key_secret: 'WoPU4WtTez8didmLuyKJEYjS' ,
      });

      const options = {
        amount: Math.round(amount * 100), // amount in the smallest currency unit
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      };

      const order = await razorpay.orders.create(options);
      res.json(order);
    } catch (error) {
      console.error("Error creating Razorpay order:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.get("/test-express", (req, res) => {
    res.send("Express is working and matching routes!");
  });

  // Static legal pages for bots and direct access
  const serveLegalPage = (fileName: string, res: any) => {
    const possiblePaths = [
      path.resolve(process.cwd(), "dist", fileName),
      path.resolve(process.cwd(), "public", fileName),
      path.resolve(__dirname, "dist", fileName),
      path.resolve(__dirname, "public", fileName)
    ];

    console.log(`[DEBUG] serveLegalPage: Searching for ${fileName}`);
    const validPath = possiblePaths.find(p => {
      try {
        const exists = fs.existsSync(p);
        console.log(`[DEBUG] Checking path: ${p} - Exists: ${exists}`);
        return exists;
      } catch (e) {
        console.error(`[DEBUG] Error checking path ${p}:`, e);
        return false;
      }
    });

    if (validPath) {
      console.log(`[DEBUG] Serving file: ${validPath}`);
      res.sendFile(validPath, (err: any) => {
        if (err) {
          console.error(`[ERROR] res.sendFile failed for ${validPath}:`, err);
          if (!res.headersSent) {
            res.status(500).send("Internal Server Error");
          }
        }
      });
    } else {
      console.error(`Could not find ${fileName} in any of: ${possiblePaths.join(", ")}`);
      // Instead of 404, let it fall through to Vite/SPA handler if it's not a bot request
      res.status(404).send(`${fileName} not found`);
    }
  };

  app.get("/privacy", (req, res) => serveLegalPage("privacy.html", res));
  app.get("/privacy-policy", (req, res) => serveLegalPage("privacy-policy.html", res));
  app.get("/terms", (req, res) => serveLegalPage("terms.html", res));
  app.get("/terms-and-conditions", (req, res) => serveLegalPage("terms-and-conditions.html", res));
  app.get("/refund", (req, res) => serveLegalPage("refund.html", res));
  app.get("/refund-policy", (req, res) => serveLegalPage("refund.html", res));
  app.get("/contact", (req, res) => serveLegalPage("contact.html", res));
  app.get("/contact-us", (req, res) => serveLegalPage("contact.html", res));
  app.get("/about", (req, res) => serveLegalPage("about.html", res));
  app.get("/about-us", (req, res) => serveLegalPage("about.html", res));


  app.get("/sitemap.xml", (req, res) => {
    const filePath = process.env.NODE_ENV === "production"
      ? path.join(process.cwd(), "dist", "sitemap.xml")
      : path.join(process.cwd(), "public", "sitemap.xml");
    res.sendFile(filePath);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Running in DEVELOPMENT mode");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    // Catch-all for dev mode to ensure SPA fallback
    app.get('*', async (req, res, next) => {
      const url = req.originalUrl;
      console.log(`[DEBUG] Dev catch-all for: ${url}`);
      try {
        const template = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf-8");
        const html = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e) {
        console.error("[ERROR] Vite transformIndexHtml failed:", e);
        next(e);
      }
    });
  } else {
    console.log("Running in PRODUCTION mode");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
