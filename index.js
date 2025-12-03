

// index.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Queue = require('bull'); // needs redis

const app = express();
app.use(cors());
app.use(express.json());

const UPLOADS_DIR = path.resolve('uploads');
const RESULTS_DIR = path.resolve('results');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR);

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Job queue (Bull) — requires REDIS_URL env or default localhost
const queue = new Queue('video-jobs', process.env.REDIS_URL || 'redis://127.0.0.1:6379');

let jobs = {}; // simple in-memory metadata. For production use DB (Postgres/Mongo)

app.get('/', (req,res)=>res.json({status:'Backend running 🚀'}));

// POST /upload-video : upload + enqueue
app.post('/upload-video', upload.single('video'), async (req,res)=>{
  try {
    if (!req.file) return res.status(400).json({error:'no file'});
    const { filename, path: filepath, mimetype } = req.file;
    const jobId = uuidv4();
    const jobData = {
      jobId,
      filename,
      inputPath: filepath,
      status: 'queued',
      createdAt: Date.now(),
      // you can include more fields like preset, text, voiceUri, image etc.
    };
    jobs[jobId] = jobData;

    // Enqueue with type & params. Worker will read job.data
    await queue.add({ jobId, filename, inputPath: filepath }, { attempts: 3 });

    return res.json({ jobId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'upload failed' });
  }
});

// GET /api/status?jobId=<id>
app.get('/api/status', (req,res)=>{
  const { jobId } = req.query;
  if (!jobId || !jobs[jobId]) return res.status(404).json({error:'job not found'});
  return res.json({
    status: jobs[jobId].status,
    resultUrl: jobs[jobId].resultUrl || null,
    createdAt: jobs[jobId].createdAt
  });
});

// Utility endpoint for worker to update status (or worker can call job queue progress)
app.post('/api/_update_job', (req,res)=>{
  const { jobId, status, resultUrl } = req.body;
  if (!jobId || !jobs[jobId]) return res.status(404).json({error:'job not found'});
  jobs[jobId].status = status;
  if (resultUrl) jobs[jobId].resultUrl = resultUrl;
  return res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log('Server running on port', PORT));
