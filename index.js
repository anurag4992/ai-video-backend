

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// Make sure uploads folder exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
  }

  // Configure multer storage
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
      filename: (req, file, cb) =>
          cb(null, Date.now() + path.extname(file.originalname)),
          });

          const upload = multer({ storage });

          // Root route
          app.get("/", (req, res) => {
            res.json({ status: "Backend working 🚀" });
            });

            // Main Upload Route - THE ONE YOUR EXPO APP CALLS
            app.post("/upload-video", upload.single("video"), (req, res) => {
              console.log("UPLOAD ROUTE HIT");

                if (!req.file) {
                    return res.status(400).json({ error: "No video file received" });
                      }

                        res.json({
                            success: true,
                                message: "Video uploaded successfully!",
                                    filename: req.file.filename,
                                      });
                                      });

                                      // Start server
                                      const PORT = process.env.PORT || 3000;
                                      app.listen(PORT, () => console.log("Server running on port", PORT));
