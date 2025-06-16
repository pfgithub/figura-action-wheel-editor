import React, { useState, useEffect, useRef } from "react";
import type { UUID, ActionWheel, Avatar, AnimationID, ConditionalSetting, TextureAsset } from "@/types";
import type { BBModel, BBModelElement, BBModelOutliner } from "@/bbmodel";
import { useAvatarStore } from "@/store/avatarStore";
import { generateUUID } from "@/utils/uuid";
import "./index.css";

// UI Components
import { Button } from "@/components/ui/Button";

// Manager Components
import { ActionWheelsManager } from "@/components/managers/ActionWheelsManager";
import { AnimationSettingsManager } from "@/components/managers/AnimationSettingsManager";
import { isValidLuaIdent, parseLua } from "@/data/generateLua";


const stringifyPart = (part: string) => {
  if (!isValidLuaIdent(part)) {
    return `[${JSON.stringify(part)}]`;
  }
  return `.${part}`;
};
function stringifyParts(parts: string[]): string {
  return parts.map(stringifyPart).join("");
};
function withoutExtension(str: string): string {
    const s = str.split(".");
    s.pop();
    return s.join(".");
}

// A component for the file drop area
function FileDropzone({ onFileLoaded, setLoadError }: { onFileLoaded: (project: Avatar, animations: AnimationID[], modelElements: string[], textures: TextureAsset[]) => void; setLoadError: (error: string | null) => void; }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    if (!files || files.length === 0) return;

    setLoadError(null); // Reset error on new attempt

    let projectFile: File | null = null;
    const bbmodelFiles: File[] = [];
    const imageFiles: File[] = [];
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp'];

    for (const file of Array.from(files)) {
      if (file.name.toLowerCase().endsWith('.figura-editor.lua')) {
        if (projectFile) {
          setLoadError('Error: Multiple "figura-editor" files found. Please provide only one figura-editor file.');
          return;
        }
        projectFile = file;
      } else if (file.name.toLowerCase().endsWith('.bbmodel')) {
        bbmodelFiles.push(file);
      } else if (imageExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
        imageFiles.push(file);
      }
    }

    try {
      // Helper to read a file as text
      const readFileAsText = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
          reader.readAsText(file);
        });
      };
      
      const readImage = (name: string, imageURL: string): Promise<TextureAsset> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                resolve({
                    name: name,
                    url: img.src,
                    width: img.width,
                    height: img.height,
                });
            };
            img.onerror = () => reject(new Error(`Failed to load image: ${name}`));
            img.src = imageURL
        });
      };

      // Read all files in parallel
      const projectFileContent = projectFile ? await readFileAsText(projectFile) : null;
      const bbmodelFileContents = await Promise.all(bbmodelFiles.map(readFileAsText));

      // --- Parse project.figura-editor.lua ---
      const projectData: Avatar = projectFileContent ? parseLua(projectFileContent) : {
        actionWheels: {},
        toggleGroups: {},
        conditionalSettings: {},
        scripts: {},
      } satisfies Avatar;
      // Basic validation
      if (!projectData.actionWheels || !projectData.toggleGroups || !projectData.conditionalSettings) {
          throw new Error('Invalid or corrupted project.figura-editor.lua format.');
      }
      projectData.scripts ??= {};


      // --- Parse bbmodels and extract animations and textures ---
      const allAnimations: AnimationID[] = [];
      const allModelElements: string[] = [];
      const allImagesPromises: Promise<TextureAsset>[] = [];
      for (let i = 0; i < bbmodelFiles.length; i++) {
        const file = bbmodelFiles[i];
        const content = bbmodelFileContents[i];
        const modelName = file.name.slice(0, file.name.length - '.bbmodel'.length);
        const model: BBModel = JSON.parse(content);

        if (!model.meta) {
          console.warn(`Skipping invalid or malformed bbmodel file: ${file.name}`);
          continue;
        }

        if (Array.isArray(model.animations)) {
            for (const anim of model.animations) {
                if (anim.name) {
                    const animationId = `animations${stringifyParts([modelName, anim.name])}` as AnimationID;
                    allAnimations.push(animationId);
                }
            }
        }

        const elements = new Map<UUID, BBModelElement>();
        if (Array.isArray(model.elements)) {
            for (const element of model.elements) {
                elements.set(element.uuid, element);
            }
        }
        
        if (Array.isArray(model.outliner)) {
            const traverseOutliner = (items: (BBModelOutliner | UUID)[], parts: string[]) => {
                for (const item of items) {
                    if (typeof item === "string") {
                        const element = elements.get(item);
                        if (element) {
                            const newParts = [...parts, element.name];
                            allModelElements.push(`models${stringifyParts(newParts)}`);
                        }
                    }else{
                        const newParts = [...parts, item.name];
                        if (item.children?.length) {
                          allModelElements.push(`models${stringifyParts(newParts)}`);
                          traverseOutliner(item.children, newParts);
                        }
                    }
                }
            };
            traverseOutliner(model.outliner, [modelName]);
        }

        if(Array.isArray(model.textures)) {
          for(const texture of model.textures) {
            if(!texture.name || !texture.source) continue;
            allImagesPromises.push(readImage(`${modelName}.${withoutExtension(texture.name)}`, texture.source))
          }
        }
      }
      
      onFileLoaded(projectData, allAnimations, allModelElements, await Promise.all(allImagesPromises));

    } catch (err: any) {
      setLoadError(err.message || 'An unknown error occurred during file processing.');
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      // Reset the input value to allow re-uploading the same file(s)
      e.target.value = '';
    }
  };

  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      className={`w-full max-w-2xl h-80 rounded-2xl border-4 border-dashed flex flex-col items-center justify-center text-center p-8 cursor-pointer transition-colors duration-300 ${isDragging ? 'border-violet-500 bg-violet-900/20' : 'border-slate-700 hover:border-slate-600 bg-slate-800/20'}`}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        multiple
      />
       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-20 h-20 mb-6 text-slate-600 transition-colors duration-300 ${isDragging ? 'text-violet-500' : ''}`}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
      <h2 className="text-2xl font-bold text-slate-200">Drag the entire contents of your figura avatar</h2>
      <p className="text-slate-400 mt-2">or click and select the full contents of your avatar folder.</p>
    </div>
  );
}

export function App() {
  const { avatar, isSaving, saveAvatar, updateAvatar, loadAvatar } = useAvatarStore();
  const [viewedWheelUuid, setViewedWheelUuid] = useState<UUID | null>(null);
  const [activeTab, setActiveTab] = useState('wheels'); // 'wheels' or 'settings'
  const [fileLoadError, setFileLoadError] = useState<string | null>(null);

  // Get temporal state and actions for undo/redo
  const { pastStates, futureStates, undo, redo } = useAvatarStore.temporal.getState();

  // Effect to keep viewedWheelUuid in sync with the available wheels
  useEffect(() => {
    if (avatar) {
      const currentWheels = Object.values(avatar.actionWheels);
      const isViewedWheelValid = viewedWheelUuid && avatar.actionWheels[viewedWheelUuid];

      if (!isViewedWheelValid) {
        // If view is invalid (null or points to a deleted wheel), reset it.
        setViewedWheelUuid(avatar.mainActionWheel ?? currentWheels[0]?.uuid ?? null);
      }
    }
  }, [avatar, viewedWheelUuid]);


  const addActionWheel = () => {
    const newWheelUuid = generateUUID();
    updateAvatar((draft) => {
      const newWheel: ActionWheel = {
        uuid: newWheelUuid,
        title: `Wheel ${Object.keys(draft.actionWheels).length + 1}`,
        actions: [],
      };
      draft.actionWheels[newWheel.uuid] = newWheel;
      if (Object.keys(draft.actionWheels).length === 1) {
        draft.mainActionWheel = newWheel.uuid;
      }
    });
    // Set the view to the newly created wheel
    setViewedWheelUuid(newWheelUuid);
  };

  const handleProjectLoad = (project: Avatar, animations: AnimationID[], modelElements: string[], textures: TextureAsset[]) => {
      loadAvatar(project, animations, modelElements, textures);
  };

  // If no project is loaded, show the dropzone.
  if (!avatar) {
    return (
      <div className="text-slate-100 h-screen flex flex-col items-center justify-center bg-slate-900 p-4" style={{ fontFamily: "'Inter', sans-serif" }}>
          <h1 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-500 mb-8">
            Avatar Editor
          </h1>
          <FileDropzone onFileLoaded={handleProjectLoad} setLoadError={setFileLoadError} />
          {fileLoadError && (
              <div className="mt-6 p-4 bg-rose-900/50 border border-rose-700 text-rose-300 rounded-lg max-w-2xl w-full">
                  <p><strong>Error:</strong> {fileLoadError}</p>
              </div>
          )}
      </div>
    );
  }

  // Once a project is loaded, show the main editor UI.
  const allToggleGroups = Object.values(avatar.toggleGroups);
  const allActionWheels = Object.values(avatar.actionWheels);

  return (
    <div className="text-slate-100 h-screen flex flex-col bg-slate-900" style={{ fontFamily: "'Inter', sans-serif" }}>
      <header className="flex justify-between items-center p-2 px-4 border-b border-slate-800 flex-shrink-0 z-20 bg-slate-900/70 backdrop-blur-lg">
        <h1 className="text-2xl md:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-500">
          Avatar Editor
        </h1>
        <div className="flex items-center gap-2">
            <Button onClick={() => undo()} disabled={pastStates.length === 0} className="bg-slate-600 hover:bg-slate-500 focus-visible:ring-slate-400">Undo</Button>
            <Button onClick={() => redo()} disabled={futureStates.length === 0} className="bg-slate-600 hover:bg-slate-500 focus-visible:ring-slate-400">Redo</Button>
            <Button onClick={saveAvatar} disabled={isSaving || pastStates.length === 0} className="bg-violet-600 hover:bg-violet-500 text-base py-2 px-6 focus-visible:ring-violet-400">
              {isSaving ? "Saving..." : "Save"}
            </Button>
        </div>
      </header>

      <main className="flex-grow min-h-0">
        {/* --- DESKTOP VIEW --- */}
        <div className="hidden lg:grid lg:grid-cols-2 h-full">
            {/* Left Column: Action Wheels Editor */}
            <div className="bg-slate-800/40 p-6 flex flex-col gap-4 overflow-y-auto border-r border-slate-800">
                <div className="border-b border-slate-700 pb-3">
                    <h2 className="text-2xl font-bold text-slate-100">Action Wheels</h2>
                </div>
                <ActionWheelsManager
                    allActionWheels={allActionWheels}
                    allToggleGroups={allToggleGroups}
                    addActionWheel={addActionWheel}
                    viewedWheelUuid={viewedWheelUuid}
                    setViewedWheelUuid={setViewedWheelUuid}
                />
            </div>

            {/* Right Column: Conditional Settings */}
            <div className="bg-slate-800/40 p-6 flex flex-col gap-4 overflow-y-auto">
               <div className="border-b border-slate-700 pb-3">
                 <h2 className="text-2xl font-bold text-slate-100">Conditional Settings</h2>
               </div>
               <AnimationSettingsManager
                    allToggleGroups={allToggleGroups}
               />
            </div>
        </div>

        {/* --- MOBILE VIEW --- */}
        <div className="lg:hidden flex flex-col h-full">
            {/* Tab Navigation */}
            <div className="flex-shrink-0 flex border-b border-slate-700">
                <button
                    onClick={() => setActiveTab('wheels')}
                    className={`flex-1 p-3 text-center text-sm font-semibold transition-colors duration-200 ${
                        activeTab === 'wheels'
                        ? 'bg-slate-700/80 text-white'
                        : 'bg-transparent text-slate-400 hover:bg-slate-800/60'
                    }`}
                >
                    Action Wheels
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`flex-1 p-3 text-center text-sm font-semibold transition-colors duration-200 ${
                        activeTab === 'settings'
                        ? 'bg-slate-700/80 text-white'
                        : 'bg-transparent text-slate-400 hover:bg-slate-800/60'
                    }`}
                >
                    Render Settings
                </button>
            </div>

            {/* Tab Content */}
            <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-4">
              {activeTab === 'wheels' && (
                <ActionWheelsManager
                  allActionWheels={allActionWheels}
                  allToggleGroups={allToggleGroups}
                  addActionWheel={addActionWheel}
                  viewedWheelUuid={viewedWheelUuid}
                  setViewedWheelUuid={setViewedWheelUuid}
                />
              )}
              {activeTab === 'settings' && (
                <AnimationSettingsManager
                  allToggleGroups={allToggleGroups}
                />
              )}
            </div>
        </div>
      </main>
    </div>
  );
}

export default App;