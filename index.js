const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Storage for uploaded videos
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });

// TEST route
app.get("/", (req, res) => {
  res.json({ status: "Backend OK" });
});

// Upload video
app.post("/upload-video", upload.single("video"), (req, res) => {
  console.log("Video uploaded:", req.file);
  res.json({
    message: "Uploaded successfully",
    filepath: req.file.path
  });
});

// AI process
app.post("/process", (req, res) => {
  res.json({
    status: "Processing done",
    outputUrl: "https://dummy.ai/output.mp4"
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));

