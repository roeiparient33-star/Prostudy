// MaterialsLibrary — ספריית החומרים: העלאה, רשימה, בחירה ומחיקה.
import { useRef, useState } from 'react';
import { FileText, Image as ImageIcon, Upload, Trash2, Loader2, Download } from 'lucide-react';
import { MAX_FILE_MB } from '../lib/premiumApi';
import { supabase } from '../lib/supabase';

function fmtSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function downloadFile(e, file) {
  e.stopPropagation();
  const { data } = await supabase.storage.from('materials').createSignedUrl(file.storage_path, 60);
  if (data?.signedUrl) {
    const a = document.createElement('a');
    a.href = data.signedUrl;
    a.download = file.file_name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

export default function MaterialsLibrary({ files, activeFileId, onSelect, onUpload, onDelete, courses = [] }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [courseId, setCourseId]   = useState('');
  const [error, setError]         = useState('');

  async function handleFiles(fileList) {
    const file = fileList?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      await onUpload(file, courseId || null);
    } catch (e) {
      const map = {
        unsupported_type: 'סוג הקובץ לא נתמך — אפשר PDF או תמונה',
        file_too_large:   `הקובץ גדול מדי — עד ${MAX_FILE_MB}MB`,
      };
      setError(map[e.message] || 'ההעלאה נכשלה, נסה שוב');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="materials-lib">
      <div className="materials-head">
        <h3>החומרים שלי</h3>
        {courses.length > 0 && (
          <select className="materials-course-select" value={courseId} onChange={e => setCourseId(e.target.value)}>
            <option value="">ללא קורס</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
          </select>
        )}
      </div>

      <div
        className={`materials-drop${uploading ? ' busy' : ''}`}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); if (!uploading) handleFiles(e.dataTransfer.files); }}
      >
        {uploading
          ? <><Loader2 size={20} className="spin"/> מעלה...</>
          : <><Upload size={20}/> גרור קובץ או לחץ להעלאה<small>PDF או תמונה · עד {MAX_FILE_MB}MB</small></>
        }
        <input
          ref={inputRef} type="file" hidden
          accept="application/pdf,image/jpeg,image/png,image/webp"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>
      {error && <div className="materials-error">{error}</div>}

      <div className="materials-list">
        {files.length === 0 && !uploading && (
          <div className="materials-empty">עוד לא העלית חומרים</div>
        )}
        {files.map(f => {
          const Icon = f.file_type === 'image' ? ImageIcon : FileText;
          return (
            <div
              key={f.id}
              className={`material-row${activeFileId === f.id ? ' active' : ''}`}
              onClick={() => onSelect(f)}
            >
              <Icon size={18} className="material-row-icon"/>
              <div className="material-row-info">
                <div className="material-row-name">{f.file_name}</div>
                <div className="material-row-meta">{fmtSize(f.size_bytes)}</div>
              </div>
              <button className="material-row-dl" title="הורד קובץ" onClick={e => downloadFile(e, f)}>
                <Download size={15}/>
              </button>
              <button className="material-row-del" title="מחק" onClick={e => { e.stopPropagation(); onDelete(f); }}>
                <Trash2 size={15}/>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
