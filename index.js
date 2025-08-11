require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.static('public'));

// Serve the view form (expects views/index.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Configure multer: store uploads in /uploads (keeps file on disk)
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Keep original filename (you can change to avoid collisions)
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });

// POST endpoint - accepts single file under field name "upfile"
app.post('/api/fileanalyse', upload.single('upfile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Respond with name, type, size
  const { originalname, mimetype, size } = req.file;
  res.json({
    name: originalname,
    type: mimetype,
    size: size
  });
});

// Optional: remove files older than x minutes on startup (cleanup)
const CLEANUP_MINUTES = 60;
setTimeout(() => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) return;
    files.forEach(file => {
      const p = path.join(uploadDir, file);
      fs.stat(p, (err, stat) => {
        if (err) return;
        const ageMin = (Date.now() - stat.mtimeMs) / 60000;
        if (ageMin > CLEANUP_MINUTES) fs.unlink(p, () => {});
      });
    });
  });
}, 5000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
