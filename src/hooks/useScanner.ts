import { useState, useCallback, useRef } from 'react';
import { type FileNode } from '../types';

export function useScanner() {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scan = useCallback(async (paths: string[]) => {
    setIsScanning(true);
    setError(null);
    setFiles([]);

    try {
      const response = await fetch('/api/scan-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths }),
      });

      if (!response.ok) throw new Error('Failed to start scanning');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      let pendingFiles: FileNode[] = [];
      let timeoutId: any = null;

      const flushFiles = () => {
        if (pendingFiles.length > 0) {
          setFiles(prev => [...prev, ...pendingFiles]);
          pendingFiles = [];
        }
        timeoutId = null;
      };

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (timeoutId) clearTimeout(timeoutId);
            flushFiles();
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim()) {
              try {
                const data = JSON.parse(line);
                if (data.error) {
                   console.error(data.error);
                   continue;
                }
                pendingFiles.push(data);
              } catch (e) {}
            }
          }

          if (!timeoutId && pendingFiles.length > 0) {
            timeoutId = setTimeout(flushFiles, 200); // 5 updates per second
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsScanning(false);
    }
  }, []);

  return { files, isScanning, error, scan };
}
