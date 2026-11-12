import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Download,
  Edit3,
  ExternalLink,
  Eye,
  File,
  FileCode2,
  FileImage,
  FileSpreadsheet,
  FileText,
  Folder,
  Globe,
  Link2,
  Loader2,
  Presentation,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { LearningResource } from '../../types/learning';
import { learningApi } from '../../lib/learningApi';
import { formatFileSize, getResourceCategoryLabel, isResourcePreviewable } from '../../lib/learning';
import { useApp } from '../../lib/context';
import { AnimatedProgressBar, ModalShell } from '../common/MotionPrimitives';
import { ConfirmDeleteDialog } from './LearningShared';

export const LessonResourcesTab: React.FC<{
  moduleId: string;
  lessonId: string | null;
  resources: LearningResource[];
  scopeLabel?: string;
}> = ({ moduleId, lessonId, resources, scopeLabel = 'lesson' }) => {
  const { updateLearningData, showToast } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [uploadFolder, setUploadFolder] = useState<string>('General');
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');

  // External Link modal
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkDesc, setLinkDesc] = useState('');
  const [linkFolder, setLinkFolder] = useState('General');
  const [savingLink, setSavingLink] = useState(false);

  // Edit Resource modal
  const [editingResource, setEditingResource] = useState<LearningResource | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editFolder, setEditFolder] = useState('General');
  const [editUrl, setEditUrl] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Preview modal
  const [previewResource, setPreviewResource] = useState<LearningResource | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState('');

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<LearningResource | null>(null);
  const [deleting, setDeleting] = useState(false);

  const folders = useMemo(() => {
    const set = new Set<string>(['General']);
    resources.forEach(r => set.add(r.folderName || 'General'));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [resources]);

  const filteredResources = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return resources.filter(r => {
      if (selectedFolder !== 'all' && (r.folderName || 'General') !== selectedFolder) return false;
      if (q) {
        return (
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          (r.originalFilename && r.originalFilename.toLowerCase().includes(q)) ||
          (r.folderName && r.folderName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [resources, selectedFolder, searchQuery]);

  // Clean up preview blob URL on close or unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleUploadFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploadError('');
    setUploading(true);
    setUploadProgress(0);

    let successCount = 0;
    const files = Array.from(fileList);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const { resource } = await learningApi.uploadResourceFile(
          {
            file,
            moduleId,
            lessonId,
            title: file.name,
            folderName: uploadFolder.trim() || 'General',
          },
          pct => {
            const overall = Math.round(((i + pct / 100) / files.length) * 100);
            setUploadProgress(overall);
          }
        );
        updateLearningData(prev => ({
          ...prev,
          resources: [resource, ...prev.resources],
        }));
        successCount++;
      } catch (err: any) {
        setUploadError(err?.message || `Failed to upload ${file.name}`);
      }
    }

    setUploading(false);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (successCount > 0) {
      showToast(successCount === 1 ? 'Resource uploaded' : `${successCount} resources uploaded`);
    }
  };

  const handleAddExternalLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkTitle.trim() || !linkUrl.trim()) return;
    setSavingLink(true);
    try {
      const { resource } = await learningApi.addResourceLink({
        moduleId,
        lessonId,
        title: linkTitle.trim(),
        description: linkDesc.trim(),
        folderName: linkFolder.trim() || 'General',
        externalUrl: linkUrl.trim(),
      });
      updateLearningData(prev => ({
        ...prev,
        resources: [resource, ...prev.resources],
      }));
      setLinkTitle('');
      setLinkUrl('');
      setLinkDesc('');
      setLinkModalOpen(false);
      showToast('External link added');
    } catch (err: any) {
      showToast(err?.message || 'Failed to add link.', 'error');
    } finally {
      setSavingLink(false);
    }
  };

  const openEditModal = (res: LearningResource) => {
    setEditingResource(res);
    setEditTitle(res.title);
    setEditDesc(res.description || '');
    setEditFolder(res.folderName || 'General');
    setEditUrl(res.externalUrl || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResource || !editTitle.trim()) return;
    setSavingEdit(true);
    try {
      const { resource: updated } = await learningApi.updateResource(editingResource.id, {
        title: editTitle.trim(),
        description: editDesc.trim(),
        folderName: editFolder.trim() || 'General',
        ...(editingResource.kind === 'link' ? { externalUrl: editUrl.trim() } : {}),
      });
      updateLearningData(prev => ({
        ...prev,
        resources: prev.resources.map(r => (r.id === updated.id ? updated : r)),
      }));
      setEditingResource(null);
      showToast('Resource updated');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update resource.', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDownload = async (res: LearningResource) => {
    if (res.kind === 'link' && res.externalUrl) {
      window.open(res.externalUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    try {
      const blob = await learningApi.fetchResourceBlob(res.id, 'attachment');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.originalFilename || res.title || 'resource';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      showToast(err?.message || 'Download failed.', 'error');
    }
  };

  const handleOpenPreview = async (res: LearningResource) => {
    const kind = isResourcePreviewable(res);
    if (!kind) {
      await handleDownload(res);
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewText(null);
    setPreviewError('');
    setPreviewResource(res);
    setPreviewLoading(true);

    try {
      const blob = await learningApi.fetchResourceBlob(res.id, 'inline');
      if (kind === 'text') {
        const text = await blob.text();
        setPreviewText(text);
      } else {
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      }
    } catch (err: any) {
      setPreviewError(err?.message || 'Failed to load file preview.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleClosePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewText(null);
    setPreviewResource(null);
    setPreviewError('');
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await learningApi.deleteResource(deleteTarget.id);
      updateLearningData(prev => ({
        ...prev,
        resources: prev.resources.filter(r => r.id !== deleteTarget.id),
      }));
      setDeleteTarget(null);
      showToast('Resource deleted', 'info');
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete resource.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const renderResourceIcon = (res: LearningResource) => {
    if (res.kind === 'link') return <Globe className="w-4 h-4 text-[#1E5A99]" />;
    const ext = (res.fileExtension || '').toLowerCase();
    if (ext === '.pdf') return <FileText className="w-4 h-4 text-[#B84A44]" />;
    if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) return <FileImage className="w-4 h-4 text-[#3E7B52]" />;
    if (['.ppt', '.pptx', '.odp'].includes(ext)) return <Presentation className="w-4 h-4 text-[#A36116]" />;
    if (['.xls', '.xlsx', '.csv'].includes(ext)) return <FileSpreadsheet className="w-4 h-4 text-[#3E7B52]" />;
    if (['.py', '.js', '.ts', '.tsx', '.sh', '.sql', '.json', '.yaml', '.yml', '.md', '.txt'].includes(ext)) {
      return <FileCode2 className="w-4 h-4 text-[#1E5A99]" />;
    }
    return <File className="w-4 h-4 text-[#6E5648]" />;
  };

  return (
    <div className="space-y-5">
      {/* Upload Dropzone + Folder Target + External Link CTA */}
      <div
        onDragOver={e => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={e => {
          e.preventDefault();
          setIsDraggingOver(false);
          void handleUploadFiles(e.dataTransfer.files);
        }}
        className={`p-5 rounded-2xl border-2 border-dashed transition-colors ${
          isDraggingOver
            ? 'bg-[#8EC5FF]/20 border-[#1E5A99]'
            : 'bg-[#F2E8DA] border-[#D6C6B2] hover:border-[#8EC5FF]'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3B2418] text-[#8EC5FF] flex items-center justify-center shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-[#3B2418]">
                Upload {scopeLabel === 'module' ? 'Module' : 'Lesson'} Materials
              </h3>
              <p className="text-xs text-[#6E5648]">
                Drag and drop files here or browse. Supports PDF, PNG/JPG/WEBP, PPT/PPTX, DOC/DOCX, TXT/Code, and ZIP up to 25 MB.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 bg-[#FAF5ED] border border-[#D6C6B2] rounded-lg px-2.5 py-1.5">
              <Folder className="w-3.5 h-3.5 text-[#6E5648]" />
              <input
                type="text"
                value={uploadFolder}
                onChange={e => setUploadFolder(e.target.value)}
                placeholder="Folder name"
                list="learning-folder-suggestions"
                className="w-28 bg-transparent text-xs text-[#3B2418] focus:outline-hidden"
                aria-label="Target folder for uploaded files"
              />
              <datalist id="learning-folder-suggestions">
                <option value="General" />
                <option value="Lecture Slides" />
                <option value="Labs & Exercises" />
                <option value="Readings" />
              </datalist>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.webp,.ppt,.pptx,.doc,.docx,.txt,.md,.csv,.json,.log,.py,.js,.ts,.tsx,.sh,.sql,.yaml,.yml,.conf,.xml,.zip,.xls,.xlsx,.odt,.odp"
              onChange={e => void handleUploadFiles(e.target.files)}
              className="hidden"
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="btn-press flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] border border-[#3B2418]/15 font-bold text-xs shadow-xs disabled:opacity-60"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              <span>{uploading ? `Uploading ${uploadProgress}%` : 'Upload Files'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLinkFolder(uploadFolder || 'General');
                setLinkModalOpen(true);
              }}
              className="btn-press flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FAF5ED] hover:bg-[#EAE0D0] text-[#3B2418] border border-[#D6C6B2] font-semibold text-xs"
            >
              <Link2 className="w-3.5 h-3.5 text-[#1E5A99]" />
              <span>Add Link</span>
            </button>
          </div>
        </div>

        {uploading && (
          <div className="mt-3">
            <AnimatedProgressBar
              percentage={uploadProgress}
              trackClassName="w-full h-1.5 rounded-full bg-[#EAE0D0] overflow-hidden"
              fillClassName="h-full bg-[#1E5A99] rounded-full"
            />
          </div>
        )}

        {uploadError && (
          <div className="mt-3 p-2.5 rounded-lg bg-[#B84A44]/10 border border-[#B84A44]/40 text-xs text-[#9E3530] flex items-center justify-between gap-2">
            <span>{uploadError}</span>
            <button type="button" onClick={() => setUploadError('')} className="text-[#9E3530] font-bold">
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Folder & Search Filter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedFolder('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              selectedFolder === 'all'
                ? 'bg-[#3B2418] text-[#F2E8DA] border-[#3B2418]'
                : 'bg-[#FAF5ED] text-[#6E5648] border-[#D6C6B2] hover:text-[#3B2418]'
            }`}
          >
            All Folders ({resources.length})
          </button>
          {folders.map(f => {
            const count = resources.filter(r => (r.folderName || 'General') === f).length;
            if (count === 0 && f !== 'General') return null;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setSelectedFolder(f)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  selectedFolder === f
                    ? 'bg-[#3B2418] text-[#8EC5FF] border-[#3B2418]'
                    : 'bg-[#FAF5ED] text-[#6E5648] border-[#D6C6B2] hover:text-[#3B2418]'
                }`}
              >
                <Folder className="w-3 h-3" />
                <span>{f}</span>
                <span className="font-mono text-[10px] opacity-80">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#6E5648] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Filter resources..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#FAF5ED] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
          />
        </div>
      </div>

      {/* Resource List */}
      {filteredResources.length === 0 ? (
        <div className="p-10 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] text-center space-y-2">
          <FileText className="w-8 h-8 text-[#1E5A99] mx-auto opacity-60" />
          <p className="text-sm font-semibold text-[#3B2418]">
            {searchQuery || selectedFolder !== 'all'
              ? 'No matching resources found'
              : `No resources attached to this ${scopeLabel} yet`}
          </p>
          <p className="text-xs text-[#6E5648]">
            Upload lecture slides, PDFs, lab guides, images, or attach external reference links.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredResources.map(res => {
            const previewType = isResourcePreviewable(res);
            return (
              <div
                key={res.id}
                className="p-4 rounded-xl bg-[#FAF5ED] border border-[#D6C6B2] hover:border-[#8EC5FF] transition-colors flex flex-col justify-between gap-3 card-hover"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] flex items-center justify-center shrink-0">
                      {renderResourceIcon(res)}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <h4 className="text-xs font-bold text-[#3B2418] truncate" title={res.title}>
                        {res.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#6E5648] font-mono tabular-nums">
                        <span>{getResourceCategoryLabel(res)}</span>
                        <span aria-hidden="true">·</span>
                        <span>{res.folderName || 'General'}</span>
                        {res.kind === 'file' && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{formatFileSize(res.fileSize)}</span>
                          </>
                        )}
                      </div>
                      {res.description && (
                        <p className="text-xs text-[#6E5648] line-clamp-2 leading-relaxed pt-0.5">
                          {res.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[#D6C6B2]/70">
                  <span className="text-[10px] font-mono text-[#6E5648] tabular-nums">
                    Added {new Date(res.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {res.kind === 'file' && previewType && (
                      <button
                        type="button"
                        onClick={() => void handleOpenPreview(res)}
                        className="btn-press flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#EAE0D0] hover:bg-[#8EC5FF]/40 text-[#3B2418] text-[11px] font-semibold"
                      >
                        <Eye className="w-3 h-3 text-[#1E5A99]" />
                        <span>Preview</span>
                      </button>
                    )}

                    {res.kind === 'file' ? (
                      <button
                        type="button"
                        onClick={() => void handleDownload(res)}
                        className="btn-press flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#F2E8DA] hover:bg-[#EAE0D0] border border-[#D6C6B2] text-[#3B2418] text-[11px] font-semibold"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </button>
                    ) : (
                      <a
                        href={res.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-press flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#8EC5FF]/35 hover:bg-[#8EC5FF]/60 border border-[#8EC5FF] text-[#3B2418] text-[11px] font-semibold"
                      >
                        <span>Open Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => openEditModal(res)}
                      className="btn-press p-1.5 rounded-md text-[#6E5648] hover:text-[#3B2418] hover:bg-[#EAE0D0]"
                      title="Rename or edit details"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(res)}
                      className="btn-press p-1.5 rounded-md text-[#6E5648] hover:text-[#B84A44] hover:bg-[#EAE0D0]"
                      title="Delete resource"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add External Link Modal */}
      <ModalShell isOpen={linkModalOpen} onClose={() => setLinkModalOpen(false)} maxWidthClass="max-w-md">
        <div className="px-5 py-3.5 border-b border-[#5A3927] bg-[#3B2418] flex items-center justify-between">
          <span className="text-xs font-bold text-[#F2E8DA]">Add External Resource Link</span>
          <button
            type="button"
            onClick={() => setLinkModalOpen(false)}
            className="text-[#D8C7B4] hover:text-[#F2E8DA]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleAddExternalLink} className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#6E5648] mb-1">Title *</label>
            <input
              type="text"
              required
              value={linkTitle}
              onChange={e => setLinkTitle(e.target.value)}
              placeholder="e.g. RFC 8446 — TLS 1.3 Specification"
              className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6E5648] mb-1">URL *</label>
            <input
              type="url"
              required
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6E5648] mb-1">Folder</label>
            <input
              type="text"
              value={linkFolder}
              onChange={e => setLinkFolder(e.target.value)}
              placeholder="General"
              className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6E5648] mb-1">Description</label>
            <textarea
              rows={2}
              value={linkDesc}
              onChange={e => setLinkDesc(e.target.value)}
              placeholder="Summary or why this reference is useful..."
              className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-[#D6C6B2]">
            <button
              type="button"
              onClick={() => setLinkModalOpen(false)}
              className="px-3 py-1.5 text-xs text-[#6E5648] hover:text-[#3B2418]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingLink}
              className="btn-press px-4 py-1.5 rounded-lg bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] font-bold text-xs border border-[#3B2418]/15"
            >
              {savingLink ? 'Saving...' : 'Save Link'}
            </button>
          </div>
        </form>
      </ModalShell>

      {/* Edit / Rename Resource Modal */}
      <ModalShell isOpen={Boolean(editingResource)} onClose={() => setEditingResource(null)} maxWidthClass="max-w-md">
        <div className="px-5 py-3.5 border-b border-[#5A3927] bg-[#3B2418] flex items-center justify-between">
          <span className="text-xs font-bold text-[#F2E8DA]">Edit Resource</span>
          <button
            type="button"
            onClick={() => setEditingResource(null)}
            className="text-[#D8C7B4] hover:text-[#F2E8DA]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSaveEdit} className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#6E5648] mb-1">Resource Name *</label>
            <input
              type="text"
              required
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
              autoFocus
            />
          </div>
          {editingResource?.kind === 'link' && (
            <div>
              <label className="block text-xs font-semibold text-[#6E5648] mb-1">External URL *</label>
              <input
                type="url"
                required
                value={editUrl}
                onChange={e => setEditUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-[#6E5648] mb-1">Folder</label>
            <input
              type="text"
              value={editFolder}
              onChange={e => setEditFolder(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6E5648] mb-1">Description</label>
            <textarea
              rows={3}
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-[#D6C6B2]">
            <button
              type="button"
              onClick={() => setEditingResource(null)}
              className="px-3 py-1.5 text-xs text-[#6E5648] hover:text-[#3B2418]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingEdit}
              className="btn-press px-4 py-1.5 rounded-lg bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] font-bold text-xs border border-[#3B2418]/15"
            >
              {savingEdit ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </ModalShell>

      {/* File Preview Modal (PDF, Image, Text/Code) */}
      <ModalShell
        isOpen={Boolean(previewResource)}
        onClose={handleClosePreview}
        maxWidthClass="max-w-4xl"
        panelClassName="bg-[#FAF5ED] border border-[#D6C6B2] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {previewResource && (
          <>
            <div className="px-5 py-3.5 border-b border-[#5A3927] bg-[#3B2418] flex items-center justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-[#F2E8DA] truncate">{previewResource.title}</h3>
                <span className="text-[11px] font-mono text-[#8EC5FF]">
                  {previewResource.originalFilename} · {formatFileSize(previewResource.fileSize)}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => void handleDownload(previewResource)}
                  className="btn-press flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#8EC5FF] text-[#3B2418] text-xs font-bold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={handleClosePreview}
                  className="p-1.5 rounded text-[#D8C7B4] hover:text-[#F2E8DA]"
                  aria-label="Close preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-[#EAE0D0] p-4 flex items-center justify-center min-h-[420px]">
              {previewLoading && (
                <div className="flex items-center gap-2 text-xs text-[#3B2418]">
                  <Loader2 className="w-4 h-4 animate-spin text-[#1E5A99]" />
                  <span>Loading secure preview...</span>
                </div>
              )}
              {previewError && (
                <div className="p-4 rounded-xl bg-[#FAF5ED] border border-[#B84A44]/40 text-xs text-[#9E3530]">
                  {previewError}
                </div>
              )}
              {!previewLoading && !previewError && previewUrl && isResourcePreviewable(previewResource) === 'image' && (
                <img
                  src={previewUrl}
                  alt={previewResource.title}
                  className="max-w-full max-h-[70vh] rounded-lg shadow-md object-contain"
                />
              )}
              {!previewLoading && !previewError && previewUrl && isResourcePreviewable(previewResource) === 'pdf' && (
                <iframe
                  src={previewUrl}
                  title={previewResource.title}
                  className="w-full h-[70vh] rounded-lg border border-[#D6C6B2] bg-white"
                />
              )}
              {!previewLoading && !previewError && previewText !== null && (
                <pre className="w-full max-h-[70vh] overflow-auto p-4 rounded-xl bg-[#2B1A11] text-[#F2E8DA] font-mono text-xs leading-relaxed border border-[#5A3927]">
                  {previewText}
                </pre>
              )}
            </div>
          </>
        )}
      </ModalShell>

      <ConfirmDeleteDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Resource"
        description={`Delete "${deleteTarget?.title || ''}" permanently? ${
          deleteTarget?.kind === 'file' ? 'The stored file will also be removed.' : ''
        }`}
        busy={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
