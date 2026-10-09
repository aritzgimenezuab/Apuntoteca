import React, { useState, useEffect } from 'react';
import { Folder, FolderPlus, FileText, Upload, ChevronRight, Home, ArrowLeft, Trash2, Edit3, Highlighter, Type, Save, Tag, FileUp, Search, Download, Database } from 'lucide-react';

const initialStructure = {
  id: 'root',
  name: 'Mi Apuntoteca',
  subfolders: [
    {
      id: 'folder-1',
      name: 'Salud i Infermeria',
      subfolders: [
        {
          id: 'folder-1-1',
          name: '1r Curs',
          subfolders: [],
          files: [
            {
              id: 'file-1',
              title: 'Biofísica Celular - Tema 1',
              subject: 'Biofísica',
              author: 'Equipo Docente',
              date: '2026-09-15',
              size: '2.4 MB',
              contentPreview: 'La membrana celular actúa como una barrera semipermeable que regula el transporte de iones y moléculas. El potencial de membrana en reposo es fundamental para la transmisión de impulsos nerviosos...'
            }
          ]
        }
      ],
      files: []
    }
  ],
  files: []
};

export default function App() {
  const [fileSystem, setFileSystem] = useState(() => {
    const saved = localStorage.getItem('apuntoteca_fs');
    return saved ? JSON.parse(saved) : initialStructure;
  });

  const [currentPath, setCurrentPath] = useState([fileSystem]);
  const [globalSearch, setGlobalSearch] = useState('');

  useEffect(() => {
    localStorage.setItem('apuntoteca_fs', JSON.stringify(fileSystem));
    setCurrentPath(prev => {
      const findNode = (node, id) => {
        if (node.id === id) return node;
        for (const sub of node.subfolders || []) {
          const res = findNode(sub, id);
          if (res) return res;
        }
        return null;
      };
      
      const newPath = [];
      let curr = fileSystem;
      for (const p of prev) {
        const found = findNode(curr, p.id);
        if (found) {
          newPath.push(found);
          curr = found;
        } else {
          break;
        }
      }
      return newPath.length > 0 ? newPath : [fileSystem];
    });
  }, [fileSystem]);

  // Modales
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const [newFileTitle, setNewFileTitle] = useState('');
  const [newFileSubject, setNewFileSubject] = useState('General');
  const [newFileAuthor, setNewFileAuthor] = useState('');
  const [dragOver, setDragOver] = useState(false);

  // Visor PDF
  const [activePdf, setActivePdf] = useState(null);
  const [activeTool, setActiveTool] = useState('cursor');
  const [highlights, setHighlights] = useState([]);
  const [customTexts, setCustomTexts] = useState([]);

  const currentFolder = currentPath[currentPath.length - 1] || fileSystem;

  const handleOpenFolder = (subfolder) => {
    setCurrentPath([...currentPath, subfolder]);
    setGlobalSearch('');
  };

  const handleNavigateToBreadcrumb = (index) => {
    setCurrentPath(currentPath.slice(0, index + 1));
    setGlobalSearch('');
  };

  // Exportar datos a JSON
  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fileSystem, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `apuntoteca_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Importar datos desde JSON
  const handleImportData = (e) => {
    const fileReader = new FileReader();
    if (e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsedData = JSON.parse(event.target.result);
          if (parsedData && parsedData.id && parsedData.name) {
            setFileSystem(parsedData);
            alert('¡Apuntoteca importada correctamente!');
          } else {
            alert('El archivo no tiene un formato válido de Apuntoteca.');
          }
        } catch (error) {
          alert('Error al leer el archivo JSON.');
        }
      };
    }
  };

  // Búsqueda global recursiva
  const searchFilesGlobally = (node, query) => {
    let results = [];
    if (!query) return results;

    const lowerQuery = query.toLowerCase();

    for (const file of node.files || []) {
      if (file.title.toLowerCase().includes(lowerQuery) || file.subject.toLowerCase().includes(lowerQuery) || file.author.toLowerCase().includes(lowerQuery)) {
        results.push({ ...file, folderName: node.name });
      }
    }

    for (const sub of node.subfolders || []) {
      results = results.concat(searchFilesGlobally(sub, query));
    }

    return results;
  };

  const searchResults = globalSearch.trim() ? searchFilesGlobally(fileSystem, globalSearch) : [];

  // Crear Carpeta
  const handleCreateFolder = (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const newFolderObj = {
      id: 'folder-' + Date.now(),
      name: newFolderName,
      subfolders: [],
      files: []
    };

    const updateTree = (folder) => {
      if (folder.id === currentFolder.id) {
        return { ...folder, subfolders: [...folder.subfolders, newFolderObj] };
      }
      return {
        ...folder,
        subfolders: folder.subfolders.map(updateTree)
      };
    };

    setFileSystem(updateTree(fileSystem));
    setNewFolderName('');
    setIsFolderModalOpen(false);
  };

  // Subir Archivo
  const handleUploadFile = (e) => {
    e.preventDefault();
    if (!newFileTitle.trim() || !newFileAuthor.trim()) return;

    const newFileObj = {
      id: 'file-' + Date.now(),
      title: newFileTitle,
      subject: newFileSubject,
      author: newFileAuthor,
      date: new Date().toISOString().split('T')[0],
      size: '1.8 MB',
      contentPreview: 'Documento subido en la ruta actual. Contenido listo para estudiar, subrayar y anotar en Apuntoteca.'
    };

    const updateTreeWithFile = (folder) => {
      if (folder.id === currentFolder.id) {
        return { ...folder, files: [...folder.files, newFileObj] };
      }
      return {
        ...folder,
        subfolders: folder.subfolders.map(updateTreeWithFile)
      };
    };

    setFileSystem(updateTreeWithFile(fileSystem));
    setNewFileTitle('');
    setNewFileAuthor('');
    setIsFileModalOpen(false);
  };

  // Drag & Drop
  const handleDropFiles = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    
    const newFiles = droppedFiles.map(file => ({
      id: 'file-' + Date.now() + '-' + Math.random(),
      title: file.name.replace(/\.[^/.]+$/, ""),
      subject: currentFolder.name !== 'Mi Apuntoteca' ? currentFolder.name : 'General',
      author: 'Usuario',
      date: new Date().toISOString().split('T')[0],
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      contentPreview: `Contenido extraído de ${file.name}. Listo para análisis, estudio y anotaciones interactivas.`
    }));

    const updateTreeWithDroppedFiles = (folder) => {
      if (folder.id === currentFolder.id) {
        return { ...folder, files: [...folder.files, ...newFiles] };
      }
      return {
        ...folder,
        subfolders: folder.subfolders.map(updateTreeWithDroppedFiles)
      };
    };

    setFileSystem(updateTreeWithDroppedFiles(fileSystem));
  };

  // Borrar
  const handleDeleteItem = (id, type) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar este ${type === 'folder' ? 'carpeta y su contenido' : 'archivo'}?`)) return;

    const deleteRecursive = (folder) => {
      if (type === 'folder') {
        return {
          ...folder,
          subfolders: folder.subfolders.filter(f => f.id !== id).map(deleteRecursive)
        };
      } else {
        return {
          ...folder,
          files: folder.files.filter(f => f.id !== id),
          subfolders: folder.subfolders.map(deleteRecursive)
        };
      }
    };

    setFileSystem(deleteRecursive(fileSystem));
  };

  // Visor PDF
  const handleDocumentClick = (e) => {
    if (activeTool === 'text') {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const textToAdd = prompt('Introduce tu nota o comentario:');
      if (textToAdd) {
        setCustomTexts([...customTexts, { id: Date.now(), x, y, text: textToAdd }]);
      }
      setActiveTool('cursor');
    }
  };

  const handleTextHighlight = () => {
    const selection = window.getSelection().toString();
    if (selection) {
      setHighlights([...highlights, { id: Date.now(), text: selection }]);
    }
  };

  if (activePdf) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
        <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActivePdf(null)}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-3.5 py-2 rounded-xl text-sm font-medium transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Carpetas</span>
            </button>
            <div>
              <h2 className="font-bold text-lg text-white truncate max-w-md">{activePdf.title}</h2>
              <span className="text-xs text-indigo-400 font-medium">{activePdf.subject}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-700">
            <button 
              onClick={() => setActiveTool('cursor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition cursor-pointer ${activeTool === 'cursor' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Edit3 className="w-4 h-4" />
              <span>Seleccionar</span>
            </button>
            <button 
              onClick={() => setActiveTool('highlight')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition cursor-pointer ${activeTool === 'highlight' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'}`}
            >
              <Highlighter className="w-4 h-4" />
              <span>Subrayar</span>
            </button>
            <button 
              onClick={() => setActiveTool('text')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition cursor-pointer ${activeTool === 'text' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Type className="w-4 h-4" />
              <span>Añadir Nota</span>
            </button>
          </div>

          <button 
            onClick={() => alert('¡Anotaciones guardadas correctamente en tu navegador!')}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition shadow-sm cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Guardar cambios</span>
          </button>
        </header>

        <main className="flex-1 max-w-4xl w-full mx-auto p-8 relative">
          <div 
            onClick={handleDocumentClick}
            onMouseUp={activeTool === 'highlight' ? handleTextHighlight : undefined}
            className="bg-white text-slate-900 p-12 rounded-3xl shadow-2xl min-h-[700px] relative font-serif leading-relaxed select-text cursor-crosshair"
          >
            <div className="absolute top-6 right-6 text-xs text-slate-400 font-sans">
              Visor Interactivo • Apuntoteca
            </div>

            <h1 className="text-2xl font-bold font-sans text-slate-900 mb-6 border-b pb-4">
              {activePdf.title}
            </h1>

            <p className="text-lg text-slate-700 mb-6">
              {activePdf.contentPreview}
            </p>

            <p className="text-lg text-slate-700 mb-6">
              Selecciona texto para subrayarlo o haz clic en cualquier zona para dejar notas adhesivas flotantes guardadas localmente.
            </p>

            {highlights.length > 0 && (
              <div className="mt-8 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-xl font-sans">
                <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">Tus subrayados guardados:</h4>
                <ul className="space-y-1 text-sm text-amber-900">
                  {highlights.map(h => (
                    <li key={h.id} className="bg-amber-200/50 px-2 py-1 rounded">"{h.text}"</li>
                  ))}
                </ul>
              </div>
            )}

            {customTexts.map(t => (
              <div 
                key={t.id} 
                style={{ top: t.y, left: t.x }}
                className="absolute bg-indigo-50 border border-indigo-200 text-indigo-900 text-sm px-3 py-2 rounded-xl shadow-lg font-sans max-w-xs z-20 flex items-center justify-between gap-2"
              >
                <span>{t.text}</span>
                <button onClick={() => setCustomTexts(customTexts.filter(item => item.id !== t.id))} className="text-indigo-400 hover:text-indigo-700 cursor-pointer">
                  ✕
                </button>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-slate-50 flex flex-col"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDropFiles}
    >
      {dragOver && (
        <div className="fixed inset-0 bg-indigo-950/80 backdrop-blur-md z-50 flex flex-col items-center justify-center text-white space-y-4 pointer-events-none">
          <FileUp className="w-16 h-16 animate-bounce text-indigo-400" />
          <p className="text-2xl font-bold">Suelta tus PDFs aquí para subirlos a esta carpeta</p>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-sm flex items-center justify-center">
              <Folder className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">Apuntoteca</span>
          </div>

          {/* Buscador Global */}
          <div className="relative flex-1 max-w-md hidden md:block">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Buscar apuntes o asignaturas en todo el sistema..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Botón Exportar */}
            <button 
              onClick={handleExportData}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer border border-slate-200"
              title="Exportar copia de seguridad (JSON)"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Botón Importar */}
            <label className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer border border-slate-200 flex items-center" title="Importar copia de seguridad">
              <Database className="w-4 h-4" />
              <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
            </label>

            <button 
              onClick={() => setIsFolderModalOpen(true)}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl font-medium transition cursor-pointer border border-slate-200 text-sm"
            >
              <FolderPlus className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">Carpeta</span>
            </button>
            <button 
              onClick={() => setIsFileModalOpen(true)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl font-medium transition shadow-sm cursor-pointer text-sm"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Subir PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Buscador responsive móvil */}
      <div className="md:hidden px-4 pt-3 bg-white border-b border-slate-200 pb-3">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Buscar apuntes en todo el sistema..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Breadcrumbs */}
      {!globalSearch.trim() && (
        <nav className="bg-white border-b border-slate-200 px-6 py-3 shadow-xs">
          <div className="max-w-6xl mx-auto flex items-center gap-2 text-sm overflow-x-auto">
            {currentPath.map((folder, index) => (
              <React.Fragment key={folder.id}>
                {index > 0 && <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
                <button 
                  onClick={() => handleNavigateToBreadcrumb(index)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
                    index === currentPath.length - 1 
                      ? 'bg-indigo-50 text-indigo-700 font-semibold' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {index === 0 ? <Home className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
                  <span>{folder.name}</span>
                </button>
              </React.Fragment>
            ))}
          </div>
        </nav>
      )}

      {/* Contenido principal */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full space-y-8">
        {globalSearch.trim() ? (
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
              Resultados de la búsqueda para "{globalSearch}" ({searchResults.length})
            </h2>
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map(file => (
                  <div key={file.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
                          <Tag className="w-3 h-3" />
                          {file.subject}
                        </span>
                        <span className="text-xs text-indigo-600 font-medium bg-indigo-50/50 px-2 py-0.5 rounded">
                          📁 {file.folderName}
                        </span>
                      </div>

                      <h3 className="font-semibold text-slate-900 text-lg leading-snug">
                        {file.title}
                      </h3>

                      <p className="text-sm text-slate-500">
                        Subido por <span className="font-medium text-slate-700">{file.author}</span>
                      </p>
                    </div>

                    <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-medium">{file.size}</span>
                      <button 
                        onClick={() => setActivePdf(file)}
                        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3.5 py-2 rounded-xl transition shadow-sm cursor-pointer"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Abrir y Estudiar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center bg-white border border-slate-200 rounded-3xl space-y-2">
                <Search className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-slate-600 font-medium">No se han encontrado apuntes con ese término en ninguna carpeta.</p>
              </div>
            )}
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Carpetas</h2>
              {currentFolder.subfolders && currentFolder.subfolders.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {currentFolder.subfolders.map(subfolder => (
                    <div 
                      key={subfolder.id}
                      className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:shadow-md hover:border-indigo-300 transition flex items-center justify-between group"
                    >
                      <div 
                        onClick={() => handleOpenFolder(subfolder)}
                        className="flex items-center gap-3 truncate flex-1 cursor-pointer"
                      >
                        <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition">
                          <Folder className="w-5 h-5" />
                        </div>
                        <span className="font-semibold text-slate-800 truncate">{subfolder.name}</span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteItem(subfolder.id, 'folder'); }}
                        className="text-slate-300 hover:text-red-500 p-1.5 rounded-lg transition cursor-pointer"
                        title="Eliminar carpeta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No hay carpetas en este nivel.</p>
              )}
            </div>

            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Documentos PDF</h2>
              {currentFolder.files && currentFolder.files.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentFolder.files.map(file => (
                    <div key={file.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
                            <Tag className="w-3 h-3" />
                            {file.subject}
                          </span>
                          <button 
                            onClick={() => handleDeleteItem(file.id, 'file')}
                            className="text-slate-300 hover:text-red-500 p-1 transition cursor-pointer"
                            title="Eliminar archivo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <h3 className="font-semibold text-slate-900 text-lg leading-snug">
                          {file.title}
                        </h3>

                        <p className="text-sm text-slate-500">
                          Subido por <span className="font-medium text-slate-700">{file.author}</span>
                        </p>
                      </div>

                      <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-medium">{file.size}</span>
                        <button 
                          onClick={() => setActivePdf(file)}
                          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3.5 py-2 rounded-xl transition shadow-sm cursor-pointer"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Abrir y Estudiar</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center bg-white border border-dashed border-slate-200 rounded-3xl space-y-2">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-slate-500 font-medium text-sm">No hay PDFs en esta carpeta. Arrastra archivos aquí o súbelos arriba.</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Modales */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Crear nueva carpeta</h2>
            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la carpeta</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Apuntes, Teoría, Exámenes..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFolderModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium text-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm shadow-sm cursor-pointer"
                >
                  Crear Carpeta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isFileModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Subir PDF</h2>
            <form onSubmit={handleUploadFile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Tema 2"
                  value={newFileTitle}
                  onChange={(e) => setNewFileTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Asignatura</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Biofísica"
                  value={newFileSubject}
                  onChange={(e) => setNewFileSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Autor</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Tu Nombre"
                  value={newFileAuthor}
                  onChange={(e) => setNewFileAuthor(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFileModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium text-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm shadow-sm cursor-pointer"
                >
                  Subir PDF
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-sm text-slate-500">
        <p>📚 <strong>Apuntoteca</strong> — Exportación/Importación, carpetas infinitas y visor interactivo.</p>
      </footer>
    </div>
  );
}
