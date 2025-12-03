// worker_api.js
// Run with: node worker_api.js
const Queue = require('bull');
const fetch = require('node-fetch');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');
const queue = new Queue('video-jobs', process.env.REDIS_URL || 'redis://127.0.0.1:6379');

const BACKEND_SERVER = process.env.BACKEND_SERVER || 'http://localhost:3000';
const PROVIDER_API_ENDPOINT = process.env.PROVIDER_API_ENDPOINT || 'https://api.example.com/v1/process';
const PROVIDER_API_KEY = process.env.PROVIDER_API_KEY || '';

queue.process(async (job, done) => {
  const { jobId, filename, inputPath } = job.data;
  console.log('Worker: processing', jobId, inputPath);

  // Update server: processing
  await fetch(`${BACKEND_SERVER}/api/_update_job`, {
    method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({jobId, status:'processing'})
  });

  try {
    // Example: send file to external provider (FormData)
    const form = new FormData();
    form.append('video', fs.createReadStream(inputPath));

    const resp = await fetch(PROVIDER_API_ENDPOINT, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${PROVIDER_API_KEY}` },
      body: form
    });

    const j = await resp.json();
    // assume provider responds with a downloadable URL or job id to poll
    if (j.resultUrl) {
      // optionally download to local results folder and serve from backend
      const resultPath = path.join('results', `${jobId}.mp4`);
      const out = fs.createWriteStream(resultPath);
      const r2 = await fetch(j.resultUrl);
      await new Promise((resolve, reject) => {
        r2.body.pipe(out);
        r2.body.on('end', resolve);
        r2.body.on('error', reject);
      });
      const publicUrl = `${BACKEND_SERVER}/results/${jobId}.mp4`;
      await fetch(`${BACKEND_SERVER}/api/_update_job`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ jobId, status:'done', resultUrl: publicUrl })
      });
    } else {
      // provider job approach -> you would poll provider until complete
      // implement as needed
      await fetch(`${BACKEND_SERVER}/api/_update_job`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ jobId, status:'failed' })
      });
    }
    done();
  } catch (err) {
    console.error(err);
    await fetch(`${BACKEND_SERVER}/api/_update_job`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ jobId, status:'failed' })
    });
    done(err);
  }
});
