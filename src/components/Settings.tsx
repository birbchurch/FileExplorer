import { useState, useEffect } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';

export function Settings() {
  const [paths, setPaths] = useState<string[]>([]);
  const [newPath, setNewPath] = useState('');

  useEffect(() => {
    const savedPaths = localStorage.getItem('nas_indexer_paths');
    if (savedPaths) {
      setPaths(JSON.parse(savedPaths));
    }
  }, []);

  const handleSave = (updatedPaths: string[]) => {
    localStorage.setItem('nas_indexer_paths', JSON.stringify(updatedPaths));
    setPaths(updatedPaths);
  };

  const handleAddPath = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPath.trim() && !paths.includes(newPath.trim())) {
      const updated = [...paths, newPath.trim()];
      handleSave(updated);
      setNewPath('');
    }
  };

  const handleRemovePath = (pathToRemove: string) => {
    const updated = paths.filter(p => p !== pathToRemove);
    handleSave(updated);
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full">
      <div className="p-4 border-b border-[#2D3139] bg-[#16191E] flex items-center gap-4">
        <h2 className="text-lg font-bold text-white tracking-tight">Settings</h2>
        <div className="h-6 w-[1px] bg-[#2D3139]"></div>
        <p className="text-[11px] uppercase text-gray-500 font-bold tracking-widest">Target Paths Config</p>
      </div>

      <div className="p-4 flex-1 overflow-auto bg-[#0F1115]">
        <div className="max-w-3xl">
          <div className="bg-[#16191E] border border-[#2D3139] rounded flex flex-col">
            <div className="p-4 border-b border-[#2D3139]">
              <form onSubmit={handleAddPath} className="flex gap-2">
                <input
                  type="text"
                  value={newPath}
                  onChange={(e) => setNewPath(e.target.value)}
                  placeholder="e.g. \\192.168.1.2\Shared"
                  className="flex-1 bg-[#0F1115] border border-[#2D3139] rounded px-3 py-1.5 text-sm font-mono text-[#E0E0E0] placeholder:text-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!newPath.trim()}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  Add Path
                </button>
              </form>
            </div>

            <div className="p-4">
              <h3 className="text-[11px] uppercase text-gray-500 font-bold mb-3">Configured Paths</h3>
              {paths.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No paths configured yet. Add a starting path above.
                </div>
              ) : (
                <ul className="space-y-2">
                  {paths.map((path) => (
                    <li key={path} className="group relative bg-[#0F1115] border border-[#2D3139] rounded p-2 flex justify-between items-center">
                      <div className="text-xs font-mono text-blue-400 truncate pr-4">{path}</div>
                      <button
                        onClick={() => handleRemovePath(path)}
                        className="text-gray-500 hover:text-red-400 transition-colors p-1"
                        title="Remove path"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
