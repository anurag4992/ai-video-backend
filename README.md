# ai-video-backend
Video maker
README - AI Processing

Options:
A) Cloud Provider (fast)
B) Local GPU (open-source)

Prereqs for both:
- Node backend (index.js) running and public
- Redis running (for Bull queue) OR use in-process queue
- results/ and uploads/ folders present and writable
- If using Cloud provider: API key, endpoint configured in worker_api.js envs

Run Redis (if using Bull):
- docker run -d -p 6379:6379 redis

Start backend:
- node index.js

Start worker (API provider):
- REDIS_URL=redis://... BACKEND_SERVER=https://your-backend node worker_api.js

Start local worker (GPU):
- Prepare GPU server with PyTorch + Wav2Lip + FOMM
- Copy worker_local.py and run: python3 worker_local.py

When a job finishes the worker POSTs the result URL back to /api/_update_job.


