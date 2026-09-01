import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { promises as fs } from 'fs';
import { minimatch } from 'minimatch';

async function scanDirectory(dir: string, fileList: any[] = [], excludeRules: string[] = []) {
  try {
    const files = await fs.readdir(dir, { withFileTypes: true });
    for (const file of files) {
      try {
        const filePath = path.join(dir, file.name);
        
        const isExcluded = excludeRules.some(rule => minimatch(filePath, rule, { dot: true, matchBase: true }));
        if (isExcluded) continue;

        const stats = await fs.stat(filePath);
        if (file.isDirectory()) {
          fileList.push({
            name: file.name,
            path: filePath,
            type: 'directory',
            mtime: stats.mtime
          });
          await scanDirectory(filePath, fileList, excludeRules);
        } else {
          fileList.push({
            name: file.name,
            path: filePath,
            type: 'file',
            size: stats.size,
            mtime: stats.mtime
          });
        }
      } catch (innerError) {
        console.error(`Error processing ${file.name} in ${dir}:`, innerError);
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error);
  }
  return fileList;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post('/api/scan-stream', async (req, res) => {
    const { paths, excludeRules = [] } = req.body;
    if (!paths || !Array.isArray(paths)) {
      return res.status(400).json({ error: 'Paths array is required' });
    }

    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Transfer-Encoding', 'chunked');

    const sendFile = (file: any) => {
      res.write(JSON.stringify(file) + '\n');
    };

    try {
      for (const scanPath of paths) {
        if (!scanPath.trim()) continue;
        await scanDirectoryStream(scanPath, sendFile, excludeRules);
      }
    } catch (error) {
      console.error('Scan error:', error);
      res.write(JSON.stringify({ error: 'Failed to scan directories' }) + '\n');
    } finally {
      res.end();
    }
  });

  async function scanDirectoryStream(dir: string, onFile: (f: any) => void, excludeRules: string[]) {
    try {
      const files = await fs.readdir(dir, { withFileTypes: true });
      for (const file of files) {
        try {
          const filePath = path.join(dir, file.name);
          
          const isExcluded = excludeRules.some(rule => minimatch(filePath, rule, { dot: true, matchBase: true }));
          if (isExcluded) continue;

          const stats = await fs.stat(filePath);
          if (file.isDirectory()) {
            onFile({
              name: file.name,
              path: filePath,
              type: 'directory',
              mtime: stats.mtime
            });
            await scanDirectoryStream(filePath, onFile, excludeRules);
          } else {
            onFile({
              name: file.name,
              path: filePath,
              type: 'file',
              size: stats.size,
              mtime: stats.mtime
            });
          }
        } catch (innerError) {
          console.error(`Error processing ${file.name} in ${dir}:`, innerError);
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dir}:`, error);
    }
  }

  // API Routes
  app.post('/api/scan', async (req, res) => {
    const { paths, excludeRules = [] } = req.body;
    if (!paths || !Array.isArray(paths)) {
      return res.status(400).json({ error: 'Paths array is required' });
    }

    try {
      let allFiles: any[] = [];
      for (const scanPath of paths) {
        if (!scanPath.trim()) continue;
        const files = await scanDirectory(scanPath, [], excludeRules);
        allFiles = allFiles.concat(files);
      }
      res.json({ files: allFiles });
    } catch (error) {
      console.error('Scan error:', error);
      res.status(500).json({ error: 'Failed to scan directories' });
    }
  });

  app.get('/api/preview', async (req, res) => {
    const filePath = req.query.path as string;
    if (!filePath) {
      return res.status(400).json({ error: 'Path parameter is required' });
    }

    try {
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) {
        return res.status(400).json({ error: 'Path is not a file' });
      }
      res.sendFile(path.resolve(filePath));
    } catch (error) {
      console.error('Preview error:', error);
      res.status(404).json({ error: 'File not found' });
    }
  });

  app.get('/api/download', async (req, res) => {
    const filePath = req.query.path as string;
    if (!filePath) {
      return res.status(400).json({ error: 'Path parameter is required' });
    }

    try {
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) {
        return res.status(400).json({ error: 'Path is not a file' });
      }
      res.download(filePath);
    } catch (error) {
      console.error('Download error:', error);
      res.status(404).json({ error: 'File not found' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
