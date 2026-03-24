
import express from "express";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import admin from "firebase-admin";
import fs from "fs";
import path from "path";

dotenv.config();

// Initialize Firebase Admin
const configPath = path.join(process.cwd(), "firebase-applet-config.json");
if (fs.existsSync(configPath)) {
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (firebaseConfig.projectId) {
    admin.initializeApp({
      projectId: firebaseConfig.projectId,
    });
    console.log("Firebase Admin initialized for project:", firebaseConfig.projectId);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for deleting a user (Admin only)
  app.post("/api/admin/delete-user", async (req, res) => {
    const { uid, idToken } = req.body;

    if (!uid || !idToken) {
      return res.status(400).json({ error: "UID and ID Token are required" });
    }

    try {
      // Verify the ID Token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const adminEmail = decodedToken.email;
      
      // Check if the user is an admin (using the same logic as firestore.rules)
      const isAdmin = adminEmail === "vanhdilac@gmail.com" || 
                      adminEmail === "ad020107@gmail.com" ||
                      adminEmail === "vietanh.ngotran@gmail.com";

      if (!isAdmin) {
        return res.status(403).json({ error: "Unauthorized: Admin privileges required" });
      }

      // Delete the user from Firebase Auth
      await admin.auth().deleteUser(uid);
      console.log(`Successfully deleted user ${uid} from Firebase Auth`);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting user from Auth:", error);
      res.status(500).json({ error: error.message || "Failed to delete user from Auth" });
    }
  });

  // API Route for a user to delete their own account
  app.post("/api/user/delete-self", async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: "ID Token is required" });
    }

    try {
      // Verify the ID Token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;

      // Delete the user from Firebase Auth
      await admin.auth().deleteUser(uid);
      console.log(`User ${uid} successfully deleted their own account`);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting self from Auth:", error);
      res.status(500).json({ error: error.message || "Failed to delete account" });
    }
  });

  // API Route for sending reset code
  app.post("/api/send-reset-code", async (req, res) => {
    const { email, code, studentId, username } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: "Email and code are required" });
    }

    // Check if SMTP is configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn("SMTP is not configured. Email will not be sent.");
      return res.status(503).json({ 
        error: "Email service is not configured. Please check .env.example"
      });
    }

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_PORT === "465",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const mailOptions = {
        from: process.env.SMTP_FROM || '"Nexus Team" <no-reply@nexus.fpt.edu.vn>',
        to: email,
        subject: "Nexus Password Reset Code",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 16px;">
            <h1 style="color: #f27024; text-align: center;">NEXUS</h1>
            <p>Hello <strong>${username || studentId}</strong>,</p>
            <p>You requested a password reset for your Nexus account.</p>
            <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-radius: 12px; margin: 20px 0;">
              <p style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Your Reset Code</p>
              <h2 style="font-size: 32px; color: #f27024; margin: 0; letter-spacing: 0.2em;">${code}</h2>
            </div>
            <p style="color: #64748b; font-size: 14px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 10px; color: #94a3b8; text-align: center;">&copy; 2025 Nexus Team | FPT University Da Nang</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      res.json({ success: true });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  // API Route for sending feedback email
  app.post("/api/send-feedback-email", async (req, res) => {
    const { feedback, user } = req.body;

    if (!feedback || !user) {
      return res.status(400).json({ error: "Feedback and user data are required" });
    }

    // Check if SMTP is configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn("SMTP is not configured. Feedback email will not be sent.");
      return res.status(503).json({ 
        error: "Email service is not configured."
      });
    }

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_PORT === "465",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const mailOptions = {
        from: process.env.SMTP_FROM || '"Nexus Feedback" <no-reply@nexus.fpt.edu.vn>',
        to: "nexus.team.fpt@gmail.com",
        subject: `New Feedback from ${user.username} (${feedback.type})`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;">
            <h1 style="color: #f27024; text-align: center;">New Feedback Received</h1>
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0;">
              <p><strong>User:</strong> ${user.username} (${user.studentId})</p>
              <p><strong>Type:</strong> ${feedback.type}</p>
              <p><strong>Rating:</strong> ${feedback.rating}/5</p>
              <p><strong>Message:</strong></p>
              <p style="white-space: pre-wrap;">${feedback.message}</p>
            </div>
            <p style="font-size: 10px; color: #94a3b8; text-align: center;">Sent from Nexus Platform</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      res.json({ success: true });
    } catch (error) {
      console.error("Error sending feedback email:", error);
      res.status(500).json({ error: "Failed to send feedback email" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
