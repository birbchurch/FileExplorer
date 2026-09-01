import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Edit2, Save, FolderOpen } from 'lucide-react';
import { type Profile } from '../types';

export function Settings() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  
  const [newProfileName, setNewProfileName] = useState('');
  const [newPath, setNewPath] = useState('');
  const [newExcludeRule, setNewExcludeRule] = useState('');

  useEffect(() => {
    const savedProfiles = localStorage.getItem('nas_indexer_profiles');
    if (savedProfiles) {
      try {
        const parsed = JSON.parse(savedProfiles);
        setProfiles(parsed);
        if (parsed.length > 0) setActiveProfileId(parsed[0].id);
      } catch (e) {}
    }
  }, []);

  const handleSaveProfiles = (updated: Profile[]) => {
    localStorage.setItem('nas_indexer_profiles', JSON.stringify(updated));
    setProfiles(updated);
  };

  const activeProfile = useMemo(() => profiles.find(p => p.id === activeProfileId), [profiles, activeProfileId]);

  const handleAddProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProfileName.trim()) {
      const newProfile: Profile = {
        id: Date.now().toString(),
        name: newProfileName.trim(),
        paths: []
      };
      const updated = [...profiles, newProfile];
      handleSaveProfiles(updated);
      setActiveProfileId(newProfile.id);
      setNewProfileName('');
    }
  };

  const handleDeleteProfile = (id: string) => {
    const updated = profiles.filter(p => p.id !== id);
    handleSaveProfiles(updated);
    if (activeProfileId === id) {
      setActiveProfileId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const handleAddPath = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeProfileId && newPath.trim()) {
      const updated = profiles.map(p => {
        if (p.id === activeProfileId && !p.paths.includes(newPath.trim())) {
          return { ...p, paths: [...p.paths, newPath.trim()] };
        }
        return p;
      });
      handleSaveProfiles(updated);
      setNewPath('');
    }
  };

  const handleRemovePath = (pathToRemove: string) => {
    if (activeProfileId) {
      const updated = profiles.map(p => {
        if (p.id === activeProfileId) {
          return { ...p, paths: p.paths.filter(path => path !== pathToRemove) };
        }
        return p;
      });
      handleSaveProfiles(updated);
    }
  };

  const handleAddExcludeRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeProfileId && newExcludeRule.trim()) {
      const updated = profiles.map(p => {
        if (p.id === activeProfileId) {
          const currentRules = p.excludeRules || [];
          if (!currentRules.includes(newExcludeRule.trim())) {
            return { ...p, excludeRules: [...currentRules, newExcludeRule.trim()] };
          }
        }
        return p;
      });
      handleSaveProfiles(updated);
      setNewExcludeRule('');
    }
  };

  const handleRemoveExcludeRule = (ruleToRemove: string) => {
    if (activeProfileId) {
      const updated = profiles.map(p => {
        if (p.id === activeProfileId && p.excludeRules) {
          return { ...p, excludeRules: p.excludeRules.filter(rule => rule !== ruleToRemove) };
        }
        return p;
      });
      handleSaveProfiles(updated);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full">
      <div className="p-4 border-b border-[#2D3139] bg-[#16191E] flex items-center gap-4">
        <h2 className="text-lg font-bold text-white tracking-tight">Settings</h2>
        <div className="h-6 w-[1px] bg-[#2D3139]"></div>
        <p className="text-[11px] uppercase text-gray-500 font-bold tracking-widest">Manage Profiles & Paths</p>
      </div>

      <div className="p-4 flex-1 overflow-auto bg-[#0F1115] flex flex-col lg:flex-row gap-6">
        
        {/* Left Column: Profiles List */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4">
          <div className="bg-[#16191E] border border-[#2D3139] rounded flex flex-col flex-1 max-h-[600px]">
            <div className="p-4 border-b border-[#2D3139]">
              <form onSubmit={handleAddProfile} className="flex gap-2">
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="New profile name..."
                  className="flex-1 bg-[#0F1115] border border-[#2D3139] rounded px-3 py-1.5 text-sm font-sans text-[#E0E0E0] placeholder:text-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!newProfileName.trim()}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded flex items-center justify-center transition-colors shrink-0"
                  title="Create Profile"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>
            </div>
            
            <div className="p-2 flex-1 overflow-auto">
              <h3 className="text-[10px] uppercase text-gray-500 font-bold px-2 py-2">Your Profiles</h3>
              {profiles.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-xs">No profiles found.</div>
              ) : (
                <div className="space-y-1">
                  {profiles.map(profile => (
                    <div 
                      key={profile.id}
                      onClick={() => setActiveProfileId(profile.id)}
                      className={`group flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-colors ${activeProfileId === profile.id ? 'bg-[#2D3139] text-white' : 'hover:bg-[#1A1D23] text-gray-400'}`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FolderOpen className="w-4 h-4 shrink-0" />
                        <span className="text-sm font-semibold truncate">{profile.name}</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteProfile(profile.id); }}
                        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Active Profile Paths */}
        <div className="w-full lg:w-2/3">
          {activeProfile ? (
            <div className="bg-[#16191E] border border-[#2D3139] rounded flex flex-col">
              <div className="p-4 border-b border-[#2D3139] flex items-center gap-3">
                <h3 className="text-sm font-bold text-white tracking-tight">Paths for <span className="text-blue-400">"{activeProfile.name}"</span></h3>
              </div>
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
                    <Plus className="w-4 h-4" /> Add Path
                  </button>
                </form>
              </div>
              <div className="p-4 border-b border-[#2D3139]">
                <h3 className="text-[11px] uppercase text-gray-500 font-bold mb-3">Configured Paths ({activeProfile.paths.length})</h3>
                {activeProfile.paths.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No paths configured yet. Add a starting path above.
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {activeProfile.paths.map((path) => (
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
              <div className="p-4 border-b border-[#2D3139]">
                <form onSubmit={handleAddExcludeRule} className="flex gap-2">
                  <input
                    type="text"
                    value={newExcludeRule}
                    onChange={(e) => setNewExcludeRule(e.target.value)}
                    placeholder="e.g. **/#recycle or node_modules"
                    className="flex-1 bg-[#0F1115] border border-[#2D3139] rounded px-3 py-1.5 text-sm font-mono text-[#E0E0E0] placeholder:text-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!newExcludeRule.trim()}
                    className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" /> Add Exclude Rule
                  </button>
                </form>
              </div>
              <div className="p-4">
                <h3 className="text-[11px] uppercase text-gray-500 font-bold mb-3">Exclude Rules ({(activeProfile.excludeRules || []).length})</h3>
                {(!activeProfile.excludeRules || activeProfile.excludeRules.length === 0) ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No exclude rules configured yet.
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {activeProfile.excludeRules.map((rule) => (
                      <li key={rule} className="group relative bg-[#0F1115] border border-[#2D3139] rounded p-2 flex justify-between items-center">
                        <div className="text-xs font-mono text-blue-400 truncate pr-4">{rule}</div>
                        <button
                          onClick={() => handleRemoveExcludeRule(rule)}
                          className="text-gray-500 hover:text-red-400 transition-colors p-1"
                          title="Remove rule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#16191E] border border-[#2D3139] rounded flex items-center justify-center h-48 text-gray-500 text-sm">
              Please select or create a profile.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
