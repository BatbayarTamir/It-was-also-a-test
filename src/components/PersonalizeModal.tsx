import React, { useState, useRef } from 'react';
import {
  X,
  Heart,
  Save,
  RotateCcw,
  Check,
  Music,
  Upload,
  Play,
  Pause,
  Trash2,
  Plus,
  Sparkles,
  FileAudio,
  Calendar,
  MapPin,
  Image as ImageIcon,
  Clock,
  Compass,
  Flame,
  Crown,
  Star,
  Gift,
  Moon,
  Sun,
  Coffee,
  Smile,
  FileText,
  Edit3,
  ChevronUp,
  ChevronDown,
  Search,
  Tag,
  Ticket,
  Sliders,
  ExternalLink,
  GitBranch,
  FolderGit2,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Globe,
  Copy,
  Terminal,
  Smartphone,
  Download,
} from 'lucide-react';
import {
  GirlfriendSiteConfig,
  Song,
  PolaroidMemory,
  Milestone,
  LoveCoupon,
  GitHubConfig,
} from '../types';
import {
  initialConfig,
  defaultMemories,
  defaultMilestones,
  defaultReasonsWhy,
  defaultCoupons,
} from '../data/mockData';
import {
  getGitHubConfig,
  saveGitHubConfig,
  testGitHubConnection,
  uploadFileToGitHub,
} from '../utils/githubStorage';

type ControlTab = 'polaroids' | 'journey' | 'notes' | 'audio' | 'letter' | 'coupons' | 'github';

interface PersonalizeModalProps {
  config: GirlfriendSiteConfig;
  isOpen: boolean;
  onClose: () => void;
  onSaveConfig: (newConfig: GirlfriendSiteConfig) => void;

  // Music / MP3s
  playlist: Song[];
  onUploadSongAudio: (songId: string, file: File) => Promise<void>;
  onResetSongAudio: (songId: string) => Promise<void>;
  onUpdateSongMeta: (songId: string, title: string, artist: string, dedication?: string, lyricsSnippet?: string) => void;
  onUpdateSongAudioUrl?: (songId: string, audioUrl: string) => void;
  onAddNewSongSlot?: () => void;
  onDeleteSong?: (songId: string) => void;
  onResetPlaylist?: () => void;

  // Polaroids
  memories: PolaroidMemory[];
  onUploadPolaroidImage: (memoryId: string, file: File) => Promise<void>;
  onUpdateMemory: (updated: PolaroidMemory) => void;
  onAddMemory: (newMemory: PolaroidMemory) => void;
  onDeleteMemory: (memoryId: string) => void;
  onReorderMemories: (newMemories: PolaroidMemory[]) => void;
  onResetMemories: () => void;

  // Journey / Milestones
  milestones: Milestone[];
  onUpdateMilestone: (updated: Milestone) => void;
  onAddMilestone: (newMilestone: Milestone) => void;
  onDeleteMilestone: (milestoneId: string) => void;
  onReorderMilestones: (newMilestones: Milestone[]) => void;
  onResetMilestones: () => void;

  // Notes / Reasons
  reasons: string[];
  onAddReason: (text: string) => void;
  onBulkAddReasons: (texts: string[]) => void;
  onUpdateReason: (index: number, newText: string) => void;
  onDeleteReason: (index: number) => void;
  onResetReasons: () => void;

  // Coupons
  coupons: LoveCoupon[];
  onUpdateCoupon: (updated: LoveCoupon) => void;
  onAddCoupon: (newCoupon: LoveCoupon) => void;
  onDeleteCoupon: (couponId: string) => void;
  onResetCoupons: () => void;
}

const MILESTONE_ICONS = [
  { name: 'Sparkles', label: 'Sparkles', icon: Sparkles },
  { name: 'Heart', label: 'Heart', icon: Heart },
  { name: 'Flame', label: 'Flame', icon: Flame },
  { name: 'Compass', label: 'Compass', icon: Compass },
  { name: 'Crown', label: 'Crown', icon: Crown },
  { name: 'Star', label: 'Star', icon: Star },
  { name: 'Gift', label: 'Gift', icon: Gift },
  { name: 'Moon', label: 'Moon', icon: Moon },
  { name: 'Sun', label: 'Sun', icon: Sun },
  { name: 'Coffee', label: 'Coffee', icon: Coffee },
  { name: 'Music', label: 'Music', icon: Music },
  { name: 'MapPin', label: 'Map Pin', icon: MapPin },
  { name: 'Smile', label: 'Smile', icon: Smile },
];

export const PersonalizeModal: React.FC<PersonalizeModalProps> = ({
  config,
  isOpen,
  onClose,
  onSaveConfig,

  // Songs
  playlist,
  onUploadSongAudio,
  onResetSongAudio,
  onUpdateSongMeta,
  onUpdateSongAudioUrl,
  onAddNewSongSlot,
  onDeleteSong,
  onResetPlaylist,

  // Polaroids
  memories,
  onUploadPolaroidImage,
  onUpdateMemory,
  onAddMemory,
  onDeleteMemory,
  onReorderMemories,
  onResetMemories,

  // Journey
  milestones,
  onUpdateMilestone,
  onAddMilestone,
  onDeleteMilestone,
  onReorderMilestones,
  onResetMilestones,

  // Notes
  reasons,
  onAddReason,
  onBulkAddReasons,
  onUpdateReason,
  onDeleteReason,
  onResetReasons,

  // Coupons
  coupons,
  onUpdateCoupon,
  onAddCoupon,
  onDeleteCoupon,
  onResetCoupons,
}) => {
  const [activeTab, setActiveTab] = useState<ControlTab>('polaroids');
  const [siteConfigData, setSiteConfigData] = useState<GirlfriendSiteConfig>({ ...config });
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Audio Preview & Upload State
  const [uploadingSongId, setUploadingSongId] = useState<string | null>(null);
  const [uploadSuccessId, setUploadSuccessId] = useState<string | null>(null);
  const [dragOverSongId, setDragOverSongId] = useState<string | null>(null);
  const [previewingSongId, setPreviewingSongId] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Song Metadata Editing
  const [editingMetaId, setEditingMetaId] = useState<string | null>(null);
  const [tempSongTitle, setTempSongTitle] = useState('');
  const [tempSongArtist, setTempSongArtist] = useState('');
  const [tempSongDedication, setTempSongDedication] = useState('');
  const [tempSongLyrics, setTempSongLyrics] = useState('');
  const [tempSongAudioUrl, setTempSongAudioUrl] = useState('');
  const [copiedPlaylistJson, setCopiedPlaylistJson] = useState(false);

  // Polaroid State
  const [uploadingMemoryId, setUploadingMemoryId] = useState<string | null>(null);
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [showNewMemoryForm, setShowNewMemoryForm] = useState(false);
  const [newMemCaption, setNewMemCaption] = useState('');
  const [newMemDate, setNewMemDate] = useState('');
  const [newMemLocation, setNewMemLocation] = useState('');
  const [newMemNote, setNewMemNote] = useState('');
  const [newMemImgUrl, setNewMemImgUrl] = useState('');
  const newMemFileInputRef = useRef<HTMLInputElement | null>(null);
  const [newMemFile, setNewMemFile] = useState<File | null>(null);

  // Journey Milestone State
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [showNewMilestoneForm, setShowNewMilestoneForm] = useState(false);
  const [newMTitle, setNewMTitle] = useState('');
  const [newMDate, setNewMDate] = useState('');
  const [newMStory, setNewMStory] = useState('');
  const [newMIcon, setNewMIcon] = useState('Heart');
  const [newMTag, setNewMTag] = useState('Chapter');

  // Notes & Reasons State
  const [notesSearch, setNotesSearch] = useState('');
  const [singleNoteText, setSingleNoteText] = useState('');
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkNotesText, setBulkNotesText] = useState('');
  const [editingReasonIndex, setEditingReasonIndex] = useState<number | null>(null);
  const [editingReasonText, setEditingReasonText] = useState('');

  // Coupon State
  const [showNewCouponForm, setShowNewCouponForm] = useState(false);
  const [newCouponTitle, setNewCouponTitle] = useState('');
  const [newCouponDesc, setNewCouponDesc] = useState('');
  const [newCouponEmoji, setNewCouponEmoji] = useState('🎁');

  // Coupon Editing State
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [editingCouponTitle, setEditingCouponTitle] = useState('');
  const [editingCouponDesc, setEditingCouponDesc] = useState('');
  const [editingCouponEmoji, setEditingCouponEmoji] = useState('🎁');

  // GitHub Settings State
  const [ghConfig, setGhConfig] = useState<GitHubConfig>(() => getGitHubConfig());
  const [ghTesting, setGhTesting] = useState(false);
  const [ghTestResult, setGhTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [ghSavedNotification, setGhSavedNotification] = useState(false);
  const [lastUploadedPath, setLastUploadedPath] = useState<string | null>(null);
  const [copiedCommands, setCopiedCommands] = useState(false);
  const [copiedYaml, setCopiedYaml] = useState(false);

  // Confirmation states (inline 2-step confirmation prevents iframe prompt failures)
  const [confirmDeleteSongId, setConfirmDeleteSongId] = useState<string | null>(null);
  const [confirmDeleteMemoryId, setConfirmDeleteMemoryId] = useState<string | null>(null);
  const [confirmDeleteMilestoneId, setConfirmDeleteMilestoneId] = useState<string | null>(null);
  const [confirmDeleteReasonIndex, setConfirmDeleteReasonIndex] = useState<number | null>(null);
  const [confirmDeleteCouponId, setConfirmDeleteCouponId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Audio Preview helpers
  const handleStopPreview = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
    }
    setPreviewingSongId(null);
  };

  const handleTogglePreview = (song: Song) => {
    if (previewingSongId === song.id) {
      handleStopPreview();
      return;
    }
    if (!song.audioUrl) return;

    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio();
      previewAudioRef.current.onended = () => setPreviewingSongId(null);
    }
    previewAudioRef.current.src = song.audioUrl;
    previewAudioRef.current.play().catch((e) => console.log('Audio preview blocked', e));
    setPreviewingSongId(song.id);
  };

  const handleClose = () => {
    handleStopPreview();
    onClose();
  };

  // Song Handlers
  const handleSongFileSelection = async (songId: string, file: File) => {
    if (!file) return;
    const isAudio = file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(file.name);
    if (!isAudio) {
      alert('Please select an audio file (.mp3, .wav, .m4a, etc.)');
      return;
    }

    setUploadingSongId(songId);
    try {
      await onUploadSongAudio(songId, file);

      // Also directly upload to GitHub resources/audio folder if configured
      if (ghConfig.enabled && ghConfig.token && ghConfig.owner && ghConfig.repo) {
        uploadFileToGitHub(file, file.name, 'audio', `Upload song audio ${file.name} to resources/audio`).then((res) => {
          if (res.success && res.path) {
            setLastUploadedPath(res.path);
            if (res.rawUrl && onUpdateSongAudioUrl) {
              onUpdateSongAudioUrl(songId, res.rawUrl);
            }
          }
        }).catch((err) => console.warn('Background GitHub audio upload error:', err));
      }

      setUploadSuccessId(songId);
      setTimeout(() => setUploadSuccessId(null), 2500);
    } catch (e) {
      console.error('Upload failed', e);
      alert('Could not process this audio file.');
    } finally {
      setUploadingSongId(null);
    }
  };

  const handleSaveSongMeta = (songId: string) => {
    onUpdateSongMeta(songId, tempSongTitle, tempSongArtist, tempSongDedication, tempSongLyrics);
    if (onUpdateSongAudioUrl) {
      onUpdateSongAudioUrl(songId, tempSongAudioUrl);
    }
    setEditingMetaId(null);
  };

  // Polaroid Handlers
  const handlePolaroidFileSelection = async (memoryId: string, file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (.jpg, .png, .webp, etc.)');
      return;
    }

    setUploadingMemoryId(memoryId);
    try {
      await onUploadPolaroidImage(memoryId, file);

      // Also directly upload to GitHub resources/photos folder if configured
      if (ghConfig.enabled && ghConfig.token && ghConfig.owner && ghConfig.repo) {
        uploadFileToGitHub(file, file.name, 'photos', `Upload memory photo ${file.name} to resources/photos`).then((res) => {
          if (res.success && res.path) {
            setLastUploadedPath(res.path);
          }
        }).catch((err) => console.warn('Background GitHub photo upload error:', err));
      }
    } catch (e) {
      console.error('Image upload failed', e);
      alert('Could not upload image.');
    } finally {
      setUploadingMemoryId(null);
    }
  };

  const handleCreateNewMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemCaption.trim()) return;

    const newId = `custom-mem-${Date.now()}`;
    let finalImageUrl =
      newMemImgUrl.trim() ||
      'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=600&q=80';

    if (newMemFile) {
      try {
        finalImageUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(newMemFile);
        });
      } catch (err) {
        console.warn('Could not read image file data', err);
      }
    }

    const newMem: PolaroidMemory = {
      id: newId,
      imageUrl: finalImageUrl,
      caption: newMemCaption,
      date: newMemDate || 'Special Day',
      location: newMemLocation || 'Our Favorite Place',
      backNote: newMemNote || 'One of the many moments with you I cherish forever.',
      rotation: Math.floor(Math.random() * 8) - 4,
    };

    onAddMemory(newMem);

    // If a real file was chosen, also persist in IndexedDB and sync to GitHub
    if (newMemFile) {
      await onUploadPolaroidImage(newId, newMemFile);
      if (ghConfig.enabled && ghConfig.token && ghConfig.owner && ghConfig.repo) {
        uploadFileToGitHub(newMemFile, newMemFile.name, 'photos', `Upload new memory photo ${newMemFile.name} to resources/photos`).then((res) => {
          if (res.success && res.path) {
            setLastUploadedPath(res.path);
          }
        }).catch((err) => console.warn('Background GitHub photo upload error:', err));
      }
    }

    setShowNewMemoryForm(false);
    setNewMemCaption('');
    setNewMemDate('');
    setNewMemLocation('');
    setNewMemNote('');
    setNewMemImgUrl('');
    setNewMemFile(null);
  };

  const moveMemory = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= memories.length) return;
    const reordered = [...memories];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    onReorderMemories(reordered);
  };

  // Milestone Handlers
  const handleCreateNewMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMTitle.trim()) return;

    const newMilestone: Milestone = {
      id: `m-custom-${Date.now()}`,
      title: newMTitle,
      date: newMDate || 'Special Chapter',
      story: newMStory || 'Another unforgettable memory written in our love story.',
      icon: newMIcon,
      tag: newMTag || `Chapter ${milestones.length + 1}`,
    };

    onAddMilestone(newMilestone);
    setShowNewMilestoneForm(false);
    setNewMTitle('');
    setNewMDate('');
    setNewMStory('');
    setNewMIcon('Heart');
    setNewMTag('Chapter');
  };

  const moveMilestone = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= milestones.length) return;
    const reordered = [...milestones];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    onReorderMilestones(reordered);
  };

  // Notes Handlers
  const handleAddSingleNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleNoteText.trim()) return;
    onAddReason(singleNoteText.trim());
    setSingleNoteText('');
  };

  const handleAddBulkNotes = () => {
    if (!bulkNotesText.trim()) return;
    const lines = bulkNotesText
      .split('\n')
      .map((l) => l.trim().replace(/^[-*•\d.]+\s*/, ''))
      .filter((l) => l.length > 0);

    if (lines.length > 0) {
      onBulkAddReasons(lines);
      setBulkNotesText('');
      setShowBulkAdd(false);
    }
  };

  const handleSaveEditedReason = (index: number) => {
    if (editingReasonText.trim()) {
      onUpdateReason(index, editingReasonText.trim());
    }
    setEditingReasonIndex(null);
  };

  // Coupons
  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponTitle.trim()) return;

    const newC: LoveCoupon = {
      id: `coupon-${Date.now()}`,
      title: newCouponTitle.trim(),
      description: newCouponDesc.trim() || 'Redeemable anytime for maximum pampering and love.',
      emoji: newCouponEmoji || '💖',
      color: 'from-rose-400 to-pink-500',
      redeemed: false,
    };

    onAddCoupon(newC);
    setShowNewCouponForm(false);
    setNewCouponTitle('');
    setNewCouponDesc('');
    setNewCouponEmoji('🎁');
  };

  // Config save
  const handleSaveSiteConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(siteConfigData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 1800);
  };

  const filteredReasons = reasons
    .map((text, idx) => ({ text, idx }))
    .filter(({ text }) => text.toLowerCase().includes(notesSearch.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-rose-200/80 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="px-5 sm:px-7 py-4 bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 text-white flex items-center justify-between flex-shrink-0 border-b border-rose-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-300">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base sm:text-lg tracking-wide text-rose-50">
                  Secret Creator Control Panel
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 border border-rose-400/40">
                  Hidden
                </span>
              </div>
              <p className="text-[11px] text-rose-200/70 font-sans">
                Tinker with photos, timeline memories, love notes, songs, and heartfelt surprises
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-rose-100 flex items-center justify-center transition-colors"
            title="Close Panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation Navigation */}
        <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2.5 bg-rose-50/70 border-b border-rose-100 overflow-x-auto no-scrollbar flex-shrink-0">
          <button
            onClick={() => setActiveTab('polaroids')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'polaroids'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-rose-100/70 border border-rose-200/60'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Polaroid Photos ({memories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('journey')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'journey'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-rose-100/70 border border-rose-200/60'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Our Journey ({milestones.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'notes'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-rose-100/70 border border-rose-200/60'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Love Notes ({reasons.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('audio')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'audio'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-rose-100/70 border border-rose-200/60'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Mixtape MP3s ({playlist.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('letter')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'letter'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-rose-100/70 border border-rose-200/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Names & Letter</span>
          </button>

          <button
            onClick={() => setActiveTab('coupons')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'coupons'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-rose-100/70 border border-rose-200/60'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Love Coupons ({coupons.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('github')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'github'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>GitHub Sync</span>
            {ghConfig.enabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            )}
          </button>
        </div>

        {/* Scrollable Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 no-scrollbar bg-slate-50/50">

          {/* ===================== TAB 1: POLAROID PHOTOS ===================== */}
          {activeTab === 'polaroids' && (
            <div className="space-y-5">
              {/* Header Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-rose-100 shadow-xs">
                <div>
                  <h4 className="font-serif font-bold text-base text-rose-950">
                    Polaroid Photo Memories
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Upload your real photos, write secret notes on the back, reorder, or add new memories.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowNewMemoryForm(!showNewMemoryForm)}
                    className="px-3.5 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{showNewMemoryForm ? 'Close Form' : 'Add New Photo'}</span>
                  </button>
                  <button
                    onClick={() => onResetMemories()}
                    className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium flex items-center gap-1 transition-all"
                    title="Reset to default photos"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* Add New Memory Form Drawer */}
              {showNewMemoryForm && (
                <form
                  onSubmit={handleCreateNewMemory}
                  className="p-4 sm:p-5 rounded-2xl bg-rose-50/80 border-2 border-rose-200 text-xs space-y-3.5 animate-in fade-in duration-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-950 flex items-center gap-1.5 text-sm">
                      <Plus className="w-4 h-4 text-rose-600" />
                      Add a New Memory Card
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowNewMemoryForm(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Caption / Moment Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={newMemCaption}
                        onChange={(e) => setNewMemCaption(e.target.value)}
                        placeholder="e.g. Stargazing on the roof"
                        className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Date / Season
                      </label>
                      <input
                        type="text"
                        value={newMemDate}
                        onChange={(e) => setNewMemDate(e.target.value)}
                        placeholder="e.g. September 14"
                        className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Location / Setting
                      </label>
                      <input
                        type="text"
                        value={newMemLocation}
                        onChange={(e) => setNewMemLocation(e.target.value)}
                        placeholder="e.g. City Overlook, Botanical Garden"
                        className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Upload Photo File (Recommended)
                      </label>
                      <input
                        ref={newMemFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setNewMemFile(e.target.files[0]);
                          }
                        }}
                        className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-rose-100 file:text-rose-700 hover:file:bg-rose-200 cursor-pointer"
                      />
                      {newMemFile && (
                        <span className="text-[10px] text-emerald-600 font-bold block mt-1">
                          ✓ Selected: {newMemFile.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Or Paste Image URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={newMemImgUrl}
                      onChange={(e) => setNewMemImgUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Secret Love Note on Back (Revealed when flipped)
                    </label>
                    <textarea
                      rows={2}
                      value={newMemNote}
                      onChange={(e) => setNewMemNote(e.target.value)}
                      placeholder="Write what made this day so special to you..."
                      className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowNewMemoryForm(false)}
                      className="px-4 py-2 rounded-full bg-white text-slate-600 border border-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-sm"
                    >
                      Save Memory to Album ✨
                    </button>
                  </div>
                </form>
              )}

              {/* Memories List */}
              <div className="space-y-3.5">
                {memories.map((mem, idx) => {
                  const isEditing = editingMemoryId === mem.id;
                  const isUploading = uploadingMemoryId === mem.id;

                  return (
                    <div
                      key={mem.id}
                      className="p-4 rounded-2xl bg-white border border-rose-100 shadow-xs hover:border-rose-300 transition-all flex flex-col md:flex-row gap-4 items-start md:items-center justify-between"
                    >
                      {/* Left: Thumbnail & Main Info */}
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        {/* Photo Thumbnail with direct upload replacement */}
                        <div className="relative w-20 h-24 sm:w-24 sm:h-28 rounded-xl overflow-hidden bg-slate-100 border-2 border-white shadow-md flex-shrink-0 group">
                          <img
                            src={mem.imageUrl}
                            alt={mem.caption}
                            className="w-full h-full object-cover"
                          />
                          <label
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold cursor-pointer text-center p-1"
                            title="Click to replace photo"
                          >
                            <Upload className="w-4 h-4 mb-0.5" />
                            <span>Replace</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handlePolaroidFileSelection(mem.id, e.target.files[0]);
                                }
                              }}
                            />
                          </label>
                          {isUploading && (
                            <div className="absolute inset-0 bg-rose-900/80 flex items-center justify-center text-white text-[10px] font-bold">
                              Saving...
                            </div>
                          )}
                        </div>

                        {/* Text details */}
                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <div className="space-y-2 text-xs">
                              <input
                                type="text"
                                value={mem.caption}
                                onChange={(e) => onUpdateMemory({ ...mem, caption: e.target.value })}
                                placeholder="Caption"
                                className="w-full px-2.5 py-1.5 border border-rose-200 rounded-lg font-bold text-rose-950"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  value={mem.date}
                                  onChange={(e) => onUpdateMemory({ ...mem, date: e.target.value })}
                                  placeholder="Date"
                                  className="w-full px-2 py-1 border border-rose-200 rounded-lg text-slate-700"
                                />
                                <input
                                  type="text"
                                  value={mem.location || ''}
                                  onChange={(e) => onUpdateMemory({ ...mem, location: e.target.value })}
                                  placeholder="Location"
                                  className="w-full px-2 py-1 border border-rose-200 rounded-lg text-slate-700"
                                />
                              </div>
                              <textarea
                                rows={2}
                                value={mem.backNote}
                                onChange={(e) => onUpdateMemory({ ...mem, backNote: e.target.value })}
                                placeholder="Secret note on back"
                                className="w-full px-2.5 py-1.5 border border-rose-200 rounded-lg text-slate-700"
                              />
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                  <span>Tilt:</span>
                                  <input
                                    type="range"
                                    min="-6"
                                    max="6"
                                    value={mem.rotation}
                                    onChange={(e) => onUpdateMemory({ ...mem, rotation: parseInt(e.target.value) })}
                                    className="w-20"
                                  />
                                  <span>{mem.rotation}°</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setEditingMemoryId(null)}
                                  className="px-3 py-1 rounded-full bg-rose-600 text-white font-semibold text-xs"
                                >
                                  Done
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="font-serif font-bold text-sm text-rose-950 truncate">
                                  {mem.caption}
                                </h5>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-semibold">
                                  {mem.date}
                                </span>
                              </div>
                              {mem.location && (
                                <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3 h-3 text-rose-400" />
                                  <span>{mem.location}</span>
                                </p>
                              )}
                              <p className="text-xs text-slate-600 font-serif italic mt-1 line-clamp-2 bg-rose-50/50 p-2 rounded-lg border border-rose-100/60">
                                "{mem.backNote}"
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Quick Actions */}
                      {!isEditing && (
                        <div className="flex items-center gap-1.5 self-end md:self-center flex-shrink-0">
                          {/* Reorder Buttons */}
                          <button
                            disabled={idx === 0}
                            onClick={() => moveMemory(idx, 'up')}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                            title="Move Earlier"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={idx === memories.length - 1}
                            onClick={() => moveMemory(idx, 'down')}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                            title="Move Later"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Details */}
                          <button
                            onClick={() => setEditingMemoryId(mem.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs font-semibold flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>

                          {/* Delete Memory */}
                          {confirmDeleteMemoryId === mem.id ? (
                            <div className="flex items-center gap-1.5 p-1 bg-red-50 border border-red-200 rounded-lg">
                              <span className="text-[10px] text-red-700 font-medium whitespace-nowrap">Remove?</span>
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteMemory(mem.id);
                                  setConfirmDeleteMemoryId(null);
                                }}
                                className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold"
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteMemoryId(null)}
                                className="px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px]"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteMemoryId(mem.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete memory"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===================== TAB 2: OUR JOURNEY (MILESTONES) ===================== */}
          {activeTab === 'journey' && (
            <div className="space-y-5">
              {/* Header Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-rose-100 shadow-xs">
                <div>
                  <h4 className="font-serif font-bold text-base text-rose-950">
                    Our Journey Chapters & Milestones
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Customize the chapters telling your love story, icons, tags, and timeline events.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowNewMilestoneForm(!showNewMilestoneForm)}
                    className="px-3.5 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{showNewMilestoneForm ? 'Close Form' : 'Add Chapter'}</span>
                  </button>
                  <button
                    onClick={() => onResetMilestones()}
                    className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium flex items-center gap-1 transition-all"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* Quick Anniversary Date Picker connected to Live Ticker */}
              <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white text-rose-600 flex items-center justify-center shadow-xs">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-rose-950 text-xs block">
                      Live Relationship Ticker Start Date:
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Calculates the exact days, hours, and seconds displayed on page 4
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={siteConfigData.anniversaryDate}
                    onChange={(e) => setSiteConfigData({ ...siteConfigData, anniversaryDate: e.target.value })}
                    className="px-3 py-1.5 bg-white border border-rose-300 rounded-xl text-xs font-semibold text-rose-950 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => onSaveConfig(siteConfigData)}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl"
                  >
                    Save Date
                  </button>
                </div>
              </div>

              {/* Add New Milestone Form */}
              {showNewMilestoneForm && (
                <form
                  onSubmit={handleCreateNewMilestone}
                  className="p-4 sm:p-5 rounded-2xl bg-rose-50/80 border-2 border-rose-200 text-xs space-y-3.5 animate-in fade-in duration-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-950 flex items-center gap-1.5 text-sm">
                      <Plus className="w-4 h-4 text-rose-600" />
                      Add a New Milestone Chapter
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowNewMilestoneForm(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Chapter Tag
                      </label>
                      <input
                        type="text"
                        value={newMTag}
                        onChange={(e) => setNewMTag(e.target.value)}
                        placeholder="e.g. Chapter 6 or Paris Trip"
                        className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Milestone Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={newMTitle}
                        onChange={(e) => setNewMTitle(e.target.value)}
                        placeholder="e.g. Moving In Together"
                        className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Date / Moment
                      </label>
                      <input
                        type="text"
                        value={newMDate}
                        onChange={(e) => setNewMDate(e.target.value)}
                        placeholder="e.g. June 2024 or Cozy Nights"
                        className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Choose Icon
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {MILESTONE_ICONS.map(({ name, label, icon: IconComp }) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setNewMIcon(name)}
                          className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-1.5 transition-all ${
                            newMIcon === name
                              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-rose-50'
                          }`}
                        >
                          <IconComp className="w-3.5 h-3.5" />
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Story & Description
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={newMStory}
                      onChange={(e) => setNewMStory(e.target.value)}
                      placeholder="Write the heartfelt story behind this chapter..."
                      className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowNewMilestoneForm(false)}
                      className="px-4 py-2 rounded-full bg-white text-slate-600 border border-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-sm"
                    >
                      Save Milestone ✨
                    </button>
                  </div>
                </form>
              )}

              {/* Milestones List */}
              <div className="space-y-3.5">
                {milestones.map((m, idx) => {
                  const isEditing = editingMilestoneId === m.id;

                  return (
                    <div
                      key={m.id}
                      className="p-4 rounded-2xl bg-white border border-rose-100 shadow-xs hover:border-rose-300 transition-all flex flex-col md:flex-row gap-4 items-start md:items-center justify-between"
                    >
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div className="space-y-2.5 text-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <input
                                type="text"
                                value={m.tag}
                                onChange={(e) => onUpdateMilestone({ ...m, tag: e.target.value })}
                                placeholder="Tag"
                                className="px-2.5 py-1.5 border border-rose-200 rounded-lg text-slate-700"
                              />
                              <input
                                type="text"
                                value={m.title}
                                onChange={(e) => onUpdateMilestone({ ...m, title: e.target.value })}
                                placeholder="Milestone Title"
                                className="px-2.5 py-1.5 border border-rose-200 rounded-lg font-bold text-rose-950"
                              />
                              <input
                                type="text"
                                value={m.date}
                                onChange={(e) => onUpdateMilestone({ ...m, date: e.target.value })}
                                placeholder="Date"
                                className="px-2.5 py-1.5 border border-rose-200 rounded-lg text-slate-700"
                              />
                            </div>

                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {MILESTONE_ICONS.map(({ name, label, icon: IconComp }) => (
                                <button
                                  key={name}
                                  type="button"
                                  onClick={() => onUpdateMilestone({ ...m, icon: name })}
                                  className={`px-2 py-1 rounded-lg border text-[11px] flex items-center gap-1 ${
                                    m.icon === name
                                      ? 'bg-rose-600 text-white border-rose-600'
                                      : 'bg-slate-50 text-slate-600 border-slate-200'
                                  }`}
                                >
                                  <IconComp className="w-3 h-3" />
                                  <span>{label}</span>
                                </button>
                              ))}
                            </div>

                            <textarea
                              rows={3}
                              value={m.story}
                              onChange={(e) => onUpdateMilestone({ ...m, story: e.target.value })}
                              className="w-full px-2.5 py-1.5 border border-rose-200 rounded-lg text-slate-700"
                            />

                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => setEditingMilestoneId(null)}
                                className="px-3 py-1 rounded-full bg-rose-600 text-white font-semibold text-xs"
                              >
                                Done
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                                {m.tag}
                              </span>
                              <h5 className="font-serif font-bold text-sm text-rose-950 truncate">
                                {m.title}
                              </h5>
                              <span className="text-[11px] text-slate-400">• {m.date}</span>
                            </div>
                            <p className="text-xs text-slate-600 font-serif leading-relaxed mt-1.5">
                              {m.story}
                            </p>
                          </div>
                        )}
                      </div>

                      {!isEditing && (
                        <div className="flex items-center gap-1.5 self-end md:self-center flex-shrink-0">
                          <button
                            disabled={idx === 0}
                            onClick={() => moveMilestone(idx, 'up')}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={idx === milestones.length - 1}
                            onClick={() => moveMilestone(idx, 'down')}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingMilestoneId(m.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs font-semibold flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          {/* Delete Milestone */}
                          {confirmDeleteMilestoneId === m.id ? (
                            <div className="flex items-center gap-1.5 p-1 bg-red-50 border border-red-200 rounded-lg">
                              <span className="text-[10px] text-red-700 font-medium whitespace-nowrap">Delete?</span>
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteMilestone(m.id);
                                  setConfirmDeleteMilestoneId(null);
                                }}
                                className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold"
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteMilestoneId(null)}
                                className="px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px]"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteMilestoneId(m.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete milestone"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===================== TAB 3: NOTES & REASONS JAR ===================== */}
          {activeTab === 'notes' && (
            <div className="space-y-5">
              {/* Header Box */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-rose-100 shadow-xs">
                <div>
                  <h4 className="font-serif font-bold text-base text-rose-950">
                    Reasons Why I Love You Notes ({reasons.length})
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Folded notes pulled from the glass jar on page 5. Edit, add new reasons, or paste a whole list.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowBulkAdd(!showBulkAdd)}
                    className="px-3.5 py-1.5 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <span>{showBulkAdd ? 'Hide Bulk Paste' : 'Bulk Paste Notes'}</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Reset love notes to original 25 reasons?')) {
                        onResetReasons();
                      }
                    }}
                    className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium flex items-center gap-1 transition-all"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* Add Single Note Input */}
              <form
                onSubmit={handleAddSingleNote}
                className="p-3.5 rounded-2xl bg-white border border-rose-200 shadow-xs flex items-center gap-2"
              >
                <Heart className="w-4 h-4 text-rose-500 flex-shrink-0 ml-1 fill-rose-100" />
                <input
                  type="text"
                  value={singleNoteText}
                  onChange={(e) => setSingleNoteText(e.target.value)}
                  placeholder="Type a new reason (e.g. The adorable way you sneeze)..."
                  className="flex-1 text-xs sm:text-sm px-2 py-1 outline-none text-slate-800"
                />
                <button
                  type="submit"
                  disabled={!singleNoteText.trim()}
                  className="px-4 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1 shadow-xs transition-all flex-shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Note</span>
                </button>
              </form>

              {/* Bulk Add Notes Drawer */}
              {showBulkAdd && (
                <div className="p-4 rounded-2xl bg-rose-50/90 border-2 border-rose-200 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-950 text-xs">
                      Bulk Paste Multiple Notes (One note per line):
                    </span>
                    <button
                      onClick={() => setShowBulkAdd(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    rows={5}
                    value={bulkNotesText}
                    onChange={(e) => setBulkNotesText(e.target.value)}
                    placeholder="The way you laugh when watching comedy movies&#10;How cozy your hand feels in mine&#10;Your patience when teaching me something new..."
                    className="w-full p-3 bg-white border border-rose-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-400 text-slate-800"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowBulkAdd(false)}
                      className="px-4 py-1.5 rounded-full bg-white text-slate-600 border border-slate-200 text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddBulkNotes}
                      className="px-5 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs"
                    >
                      Add All Notes ✨
                    </button>
                  </div>
                </div>
              )}

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={notesSearch}
                  onChange={(e) => setNotesSearch(e.target.value)}
                  placeholder="Search existing notes..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-rose-300"
                />
              </div>

              {/* List of Notes */}
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1 no-scrollbar">
                {filteredReasons.map(({ text, idx }) => {
                  const isEditing = editingReasonIndex === idx;

                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white border border-rose-100 hover:border-rose-300 transition-all flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="w-6 h-6 rounded-full bg-rose-50 text-rose-700 font-bold flex items-center justify-center text-[10px] flex-shrink-0 border border-rose-100">
                        {idx + 1}
                      </span>

                      {isEditing ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={editingReasonText}
                            onChange={(e) => setEditingReasonText(e.target.value)}
                            className="flex-1 px-2.5 py-1 border border-rose-300 rounded-lg text-slate-800 outline-none"
                          />
                          <button
                            onClick={() => handleSaveEditedReason(idx)}
                            className="px-3 py-1 rounded-full bg-rose-600 text-white font-semibold text-[11px]"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <p className="flex-1 text-slate-700 font-serif leading-relaxed">
                          {text}
                        </p>
                      )}

                      {!isEditing && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => {
                              setEditingReasonIndex(idx);
                              setEditingReasonText(text);
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Edit Note"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          {confirmDeleteReasonIndex === idx ? (
                            <div className="flex items-center gap-1 p-0.5 bg-red-50 border border-red-200 rounded-md">
                              <span className="text-[9px] text-red-700 font-medium">Del?</span>
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteReason(idx);
                                  setConfirmDeleteReasonIndex(null);
                                }}
                                className="px-1.5 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white text-[9px] font-bold"
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteReasonIndex(null)}
                                className="px-1.5 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 text-[9px]"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteReasonIndex(idx)}
                              className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50"
                              title="Delete Note"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===================== TAB 4: MIXTAPE MP3s ===================== */}
          {activeTab === 'audio' && (
            <div className="space-y-5">
              {/* Header Box */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-rose-100 shadow-xs">
                <div>
                  <h4 className="font-serif font-bold text-base text-rose-950">
                    Love Mixtape & MP3 Songs
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure real songs that play across all devices, mobile phones, and computers.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {onAddNewSongSlot && (
                    <button
                      onClick={onAddNewSongSlot}
                      className="px-3.5 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New Song Slot</span>
                    </button>
                  )}
                  {onResetPlaylist && (
                    <button
                      onClick={onResetPlaylist}
                      className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium flex items-center gap-1 transition-all"
                      title="Reset playlist to default songs"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Cross-Device & Mobile Audio Playback Guide */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-200/80 space-y-2.5 text-xs text-amber-950">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <Smartphone className="w-4 h-4 text-amber-600" />
                    <span>How to Play Songs on Her Phone & Other Devices</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const manifest = playlist.map((s) => ({
                          id: s.id,
                          title: s.title,
                          artist: s.artist,
                          duration: s.duration,
                          dedication: s.dedication,
                          tone: s.tone,
                          lyricsSnippet: s.lyricsSnippet,
                          accentColor: s.accentColor,
                          audioUrl: s.audioUrl && !s.audioUrl.startsWith('blob:') ? s.audioUrl : `./audio/${s.id}.mp3`,
                        }));
                        navigator.clipboard.writeText(JSON.stringify(manifest, null, 2));
                        setCopiedPlaylistJson(true);
                        setTimeout(() => setCopiedPlaylistJson(false), 2500);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-medium flex items-center gap-1.5 border border-amber-300 transition-colors"
                      title="Copy public/playlist.json configuration"
                    >
                      {copiedPlaylistJson ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedPlaylistJson ? 'Copied playlist.json!' : 'Copy playlist.json'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const manifest = playlist.map((s) => ({
                          id: s.id,
                          title: s.title,
                          artist: s.artist,
                          duration: s.duration,
                          dedication: s.dedication,
                          tone: s.tone,
                          lyricsSnippet: s.lyricsSnippet,
                          accentColor: s.accentColor,
                          audioUrl: s.audioUrl && !s.audioUrl.startsWith('blob:') ? s.audioUrl : `./audio/${s.id}.mp3`,
                        }));
                        const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'playlist.json';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 text-amber-900 font-medium flex items-center gap-1.5 border border-amber-300 transition-colors shadow-2xs"
                      title="Download playlist.json to place in public/ folder"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download playlist.json</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] leading-relaxed text-amber-900/90">
                  <div className="bg-white/80 p-2.5 rounded-xl border border-amber-100">
                    <p className="font-semibold text-amber-950 mb-1">Option 1: Paste Direct Audio URLs</p>
                    <p>
                      Click <strong>Edit</strong> on any song below and paste a direct MP3 link (Dropbox, Google Drive direct, Catbox, Discord, or any web host). It will instantly play on any phone or computer without uploading files to GitHub!
                    </p>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-xl border border-amber-100">
                    <p className="font-semibold text-amber-950 mb-1">Option 2: Commit MP3s to your Repository</p>
                    <p>
                      Place your audio files into the repository's <code>public/audio/</code> folder named <code>song-1.mp3</code>, <code>song-waiting.mp3</code>, <code>song-5.mp3</code>, <code>song-nexz.mp3</code>, <code>song-saucin.mp3</code>. The site automatically detects and plays them for anyone visiting!
                    </p>
                  </div>
                </div>
              </div>

              {/* Songs List */}
              <div className="space-y-3.5">
                {playlist.map((song) => {
                  const hasCustomAudio = !!song.audioUrl || song.isCustomUpload;
                  const isUploading = uploadingSongId === song.id;
                  const isUploadSuccess = uploadSuccessId === song.id;
                  const isPreviewing = previewingSongId === song.id;
                  const isDragOver = dragOverSongId === song.id;
                  const isEditingMeta = editingMetaId === song.id;

                  return (
                    <div
                      key={song.id}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverSongId(song.id);
                      }}
                      onDragLeave={() => setDragOverSongId(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOverSongId(null);
                        const files = e.dataTransfer.files;
                        if (files && files.length > 0) {
                          handleSongFileSelection(song.id, files[0]);
                        }
                      }}
                      className={`p-4 rounded-2xl border transition-all ${
                        isDragOver
                          ? 'border-rose-500 bg-rose-50/90 shadow-md ring-2 ring-rose-400'
                          : 'border-rose-100 bg-white shadow-xs hover:border-rose-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Song Details */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-xs mt-0.5"
                            style={{ backgroundColor: song.accentColor || '#f43f5e' }}
                          >
                            <Music className="w-5 h-5" />
                          </div>

                          <div className="min-w-0 flex-1">
                            {isEditingMeta ? (
                              <div className="space-y-2 text-xs">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Song Title</label>
                                    <input
                                      type="text"
                                      value={tempSongTitle}
                                      onChange={(e) => setTempSongTitle(e.target.value)}
                                      placeholder="Song Title"
                                      className="w-full px-2.5 py-1 border border-rose-200 rounded-lg font-bold text-rose-950"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Artist</label>
                                    <input
                                      type="text"
                                      value={tempSongArtist}
                                      onChange={(e) => setTempSongArtist(e.target.value)}
                                      placeholder="Artist Name"
                                      className="w-full px-2.5 py-1 border border-rose-200 rounded-lg text-slate-700"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-medium text-slate-500 mb-0.5">
                                    Direct Audio URL / Cloud Link <span className="text-rose-600 font-semibold">(Plays on phones & all devices)</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={tempSongAudioUrl}
                                    onChange={(e) => setTempSongAudioUrl(e.target.value)}
                                    placeholder="e.g. https://.../song.mp3 or ./audio/song-1.mp3"
                                    className="w-full px-2.5 py-1 border border-rose-200 rounded-lg text-slate-700 font-mono text-[11px]"
                                  />
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    Direct link to MP3 (Dropbox, Google Drive direct, Catbox, Discord, or public web host).
                                  </p>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Dedication Message</label>
                                  <input
                                    type="text"
                                    value={tempSongDedication}
                                    onChange={(e) => setTempSongDedication(e.target.value)}
                                    placeholder="Dedication note..."
                                    className="w-full px-2.5 py-1 border border-rose-200 rounded-lg text-slate-700"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Lyrics Snippet (Optional)</label>
                                  <input
                                    type="text"
                                    value={tempSongLyrics}
                                    onChange={(e) => setTempSongLyrics(e.target.value)}
                                    placeholder="Romantic lyric snippet..."
                                    className="w-full px-2.5 py-1 border border-rose-200 rounded-lg text-slate-700"
                                  />
                                </div>

                                <div className="flex justify-end gap-1.5 pt-1">
                                  <button
                                    onClick={() => setEditingMetaId(null)}
                                    className="px-2.5 py-1 rounded-md text-slate-500 border hover:bg-slate-50"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleSaveSongMeta(song.id)}
                                    className="px-3 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs"
                                  >
                                    Save Info & Audio URL
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-center gap-2">
                                  <h5 className="font-serif font-bold text-sm text-rose-950 truncate">
                                    {song.title}
                                  </h5>
                                  <span className="text-xs text-slate-500">• {song.artist}</span>
                                  {hasCustomAudio && (
                                    <span
                                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                                        song.audioUrl?.startsWith('http')
                                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                                          : song.audioUrl?.startsWith('.')
                                          ? 'bg-purple-100 text-purple-800 border-purple-200'
                                          : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                      }`}
                                    >
                                      {song.audioUrl?.startsWith('http')
                                        ? 'Cloud MP3'
                                        : song.audioUrl?.startsWith('.')
                                        ? 'Repository Audio'
                                        : 'Local Device MP3'}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 italic mt-0.5 truncate">
                                  "{song.dedication}"
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Song Actions */}
                        {!isEditingMeta && (
                          <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                            {/* In-modal Preview */}
                            {hasCustomAudio && (
                              <button
                                onClick={() => handleTogglePreview(song)}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                  isPreviewing
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                }`}
                                title={isPreviewing ? 'Stop Preview' : 'Listen Preview'}
                              >
                                {isPreviewing ? (
                                  <>
                                    <Pause className="w-3 h-3" />
                                    <span>Playing</span>
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-3 h-3" />
                                    <span>Preview</span>
                                  </>
                                )}
                              </button>
                            )}

                            {/* Upload MP3 button */}
                            <label className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-600 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors">
                              <Upload className="w-3 h-3" />
                              <span>{isUploading ? 'Uploading...' : hasCustomAudio ? 'Change MP3' : 'Upload MP3'}</span>
                              <input
                                type="file"
                                accept="audio/*,.mp3,.wav,.m4a,.ogg"
                                className="hidden"
                                disabled={isUploading}
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleSongFileSelection(song.id, e.target.files[0]);
                                  }
                                }}
                              />
                            </label>

                            {/* Edit Info */}
                            <button
                              onClick={() => {
                                setEditingMetaId(song.id);
                                setTempSongTitle(song.title);
                                setTempSongArtist(song.artist);
                                setTempSongDedication(song.dedication);
                                setTempSongLyrics(song.lyricsSnippet || '');
                                setTempSongAudioUrl(song.audioUrl && !song.audioUrl.startsWith('blob:') ? song.audioUrl : '');
                              }}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                              title="Edit song title & artist"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Revert custom MP3 */}
                            {hasCustomAudio && (
                              <button
                                onClick={async () => {
                                  await onResetSongAudio(song.id);
                                  if (previewingSongId === song.id) handleStopPreview();
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                title="Revert to synthesized chords"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Remove Song from mixtape */}
                            {onDeleteSong && (
                              confirmDeleteSongId === song.id ? (
                                <div className="flex items-center gap-1.5 p-1 bg-red-50 border border-red-200 rounded-lg">
                                  <span className="text-[10px] text-red-700 font-medium whitespace-nowrap">Remove?</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onDeleteSong(song.id);
                                      setConfirmDeleteSongId(null);
                                    }}
                                    className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold"
                                  >
                                    Yes
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteSongId(null)}
                                    className="px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px]"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  disabled={playlist.length <= 1}
                                  onClick={() => setConfirmDeleteSongId(song.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:bg-transparent transition-colors"
                                  title={playlist.length <= 1 ? 'Keep at least one song in your mixtape' : 'Remove song from mixtape'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )
                            )}
                          </div>
                        )}
                      </div>

                      {isUploadSuccess && (
                        <div className="mt-2 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Custom MP3 successfully assigned and saved!</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===================== TAB 5: LOVE LETTER & NAMES ===================== */}
          {activeTab === 'letter' && (
            <form onSubmit={handleSaveSiteConfig} className="space-y-4">
              <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-xs flex items-center justify-between">
                <div>
                  <h4 className="font-serif font-bold text-base text-rose-950">
                    Names, Anniversary Date & Sealed Love Letter
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Personalize her name on the cover, headings, wax-sealed letter, and your signoff.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSiteConfigData({ ...initialConfig })}
                  className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium flex items-center gap-1 transition-all"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Default Letter</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-rose-900 mb-1">
                    Her Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={siteConfigData.herName}
                    onChange={(e) => setSiteConfigData({ ...siteConfigData, herName: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-rose-900 mb-1">
                    Her Nickname
                  </label>
                  <input
                    type="text"
                    required
                    value={siteConfigData.herNickname}
                    onChange={(e) => setSiteConfigData({ ...siteConfigData, herNickname: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-rose-900 mb-1">
                    Your Name / Signoff
                  </label>
                  <input
                    type="text"
                    required
                    value={siteConfigData.hisName}
                    onChange={(e) => setSiteConfigData({ ...siteConfigData, hisName: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-rose-900 mb-1">
                    Anniversary / Relationship Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={siteConfigData.anniversaryDate}
                    onChange={(e) => setSiteConfigData({ ...siteConfigData, anniversaryDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-rose-900 mb-1">
                    Letter Salutation / Greeting
                  </label>
                  <input
                    type="text"
                    required
                    value={siteConfigData.letterTitle}
                    onChange={(e) => setSiteConfigData({ ...siteConfigData, letterTitle: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-rose-900 mb-1">
                  Handwritten Love Letter Body
                </label>
                <textarea
                  rows={8}
                  required
                  value={siteConfigData.letterBody}
                  onChange={(e) => setSiteConfigData({ ...siteConfigData, letterBody: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-rose-200 rounded-xl text-xs font-serif leading-relaxed outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-rose-900 mb-1">
                  Closing Signoff Line
                </label>
                <input
                  type="text"
                  required
                  value={siteConfigData.letterSignoff}
                  onChange={(e) => setSiteConfigData({ ...siteConfigData, letterSignoff: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                {savedSuccess && (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Letter settings successfully saved!</span>
                  </span>
                )}
                <div className="ml-auto">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Letter & Config</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ===================== TAB 6: LOVE COUPONS ===================== */}
          {activeTab === 'coupons' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-rose-100 shadow-xs">
                <div>
                  <h4 className="font-serif font-bold text-base text-rose-950">
                    Love Coupons ({coupons.length})
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pampering coupons on page 7. Edit perks or reset redeemed status so she can use them again.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowNewCouponForm(!showNewCouponForm)}
                    className="px-3.5 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Coupon</span>
                  </button>
                  <button
                    onClick={() => onResetCoupons()}
                    className="px-3 py-1.5 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-1 transition-all"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset All to Unredeemed</span>
                  </button>
                </div>
              </div>

              {/* Add Coupon Form */}
              {showNewCouponForm && (
                <form
                  onSubmit={handleCreateCoupon}
                  className="p-4 rounded-2xl bg-rose-50/80 border-2 border-rose-200 text-xs space-y-3 animate-in fade-in duration-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-950 text-sm">Add New Love Coupon</span>
                    <button
                      type="button"
                      onClick={() => setShowNewCouponForm(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">Coupon Title *</label>
                      <input
                        type="text"
                        required
                        value={newCouponTitle}
                        onChange={(e) => setNewCouponTitle(e.target.value)}
                        placeholder="e.g. 1 Full Day Road Trip of Your Choice"
                        className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Emoji Icon</label>
                      <input
                        type="text"
                        value={newCouponEmoji}
                        onChange={(e) => setNewCouponEmoji(e.target.value)}
                        placeholder="e.g. 🚗, 🍰, 💆‍♀️"
                        className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Perk Description</label>
                    <textarea
                      rows={2}
                      value={newCouponDesc}
                      onChange={(e) => setNewCouponDesc(e.target.value)}
                      placeholder="Details of what this coupon covers..."
                      className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowNewCouponForm(false)}
                      className="px-4 py-1.5 rounded-full bg-white text-slate-600 border border-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-1.5 rounded-full bg-rose-600 text-white font-semibold"
                    >
                      Create Coupon ✨
                    </button>
                  </div>
                </form>
              )}

              {/* Coupons List */}
              <div className="space-y-3">
                {coupons.map((c) => {
                  const isEditing = editingCouponId === c.id;

                  if (isEditing) {
                    return (
                      <div
                        key={c.id}
                        className="p-4 rounded-2xl bg-rose-50/70 border-2 border-rose-300 text-xs space-y-3 animate-in fade-in duration-150"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-rose-950">Editing Coupon</span>
                          <button
                            type="button"
                            onClick={() => setEditingCouponId(null)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2">
                            <label className="block font-semibold text-slate-700 mb-1">Coupon Title</label>
                            <input
                              type="text"
                              value={editingCouponTitle}
                              onChange={(e) => setEditingCouponTitle(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-rose-200 rounded-xl outline-none"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Emoji Icon</label>
                            <input
                              type="text"
                              value={editingCouponEmoji}
                              onChange={(e) => setEditingCouponEmoji(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-rose-200 rounded-xl outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Perk Description</label>
                          <textarea
                            rows={2}
                            value={editingCouponDesc}
                            onChange={(e) => setEditingCouponDesc(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-rose-200 rounded-xl outline-none"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingCouponId(null)}
                            className="px-3.5 py-1 rounded-full bg-white text-slate-600 border border-slate-200 text-xs"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateCoupon({
                                ...c,
                                title: editingCouponTitle.trim() || c.title,
                                emoji: editingCouponEmoji.trim() || c.emoji,
                                description: editingCouponDesc.trim() || c.description,
                              });
                              setEditingCouponId(null);
                            }}
                            className="px-4 py-1 rounded-full bg-rose-600 text-white font-semibold text-xs"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-2xl bg-white border border-rose-100 flex items-center justify-between gap-3 text-xs hover:border-rose-200 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl p-2 rounded-xl bg-rose-50 border border-rose-100 flex-shrink-0">
                          {c.emoji}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-slate-900">{c.title}</h5>
                            {c.redeemed ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold">
                                Redeemed
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-slate-500 text-[11px] mt-0.5">{c.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Edit button */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCouponId(c.id);
                            setEditingCouponTitle(c.title);
                            setEditingCouponDesc(c.description);
                            setEditingCouponEmoji(c.emoji);
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                          title="Edit coupon"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Toggle redeemed */}
                        <button
                          type="button"
                          onClick={() => onUpdateCoupon({ ...c, redeemed: !c.redeemed })}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold hover:bg-slate-50"
                        >
                          {c.redeemed ? 'Mark Active' : 'Mark Redeemed'}
                        </button>

                        {/* Delete coupon */}
                        {confirmDeleteCouponId === c.id ? (
                          <div className="flex items-center gap-1 p-0.5 bg-red-50 border border-red-200 rounded-lg">
                            <span className="text-[10px] text-red-700 font-medium whitespace-nowrap">Delete?</span>
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteCoupon(c.id);
                                setConfirmDeleteCouponId(null);
                              }}
                              className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteCouponId(null)}
                              className="px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteCouponId(c.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete coupon"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===================== TAB 7: GITHUB SYNC ===================== */}
          {activeTab === 'github' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Header Box */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    <FolderGit2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
                      GitHub Repository Sync
                      {ghConfig.enabled && (
                        <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Active
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed max-w-xl">
                      Uploads (photos & audio) automatically commit straight into the 
                      <code className="mx-1 px-1.5 py-0.5 bg-slate-100 rounded text-slate-800 font-mono text-[11px] font-bold">
                        /{ghConfig.resourcesPath || 'resources'}/
                      </code>
                      folder in your GitHub repository via GitHub REST API.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ghConfig.enabled}
                      onChange={(e) => {
                        const updated = { ...ghConfig, enabled: e.target.checked };
                        setGhConfig(updated);
                        saveGitHubConfig(updated);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    <span className="ml-2 text-xs font-semibold text-slate-700">
                      {ghConfig.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Status Banner */}
              {lastUploadedPath && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2 animate-in fade-in">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>
                    Last uploaded file committed to GitHub: <strong className="font-mono text-emerald-950">{lastUploadedPath}</strong>
                  </span>
                </div>
              )}

              {/* GitHub Pages Host Live Deployment Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-md space-y-4 border border-indigo-900/50">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white flex-shrink-0">
                      <Globe className="w-5 h-5 text-indigo-300" />
                    </div>
                    <div>
                      <h5 className="font-serif font-bold text-base text-white flex items-center gap-2">
                        Host at BatbayarTamir.github.io
                      </h5>
                      <p className="text-xs text-slate-300 mt-0.5">
                        GitHub Pages live user website configuration
                      </p>
                    </div>
                  </div>
                  <a
                    href="https://BatbayarTamir.github.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors border border-white/20 self-start sm:self-center"
                  >
                    <span>Open Live Site</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="p-3 bg-black/40 rounded-xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Target URL:</span>
                    <span className="font-mono text-emerald-300 font-bold">
                      https://BatbayarTamir.github.io
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
                    GitHub Pages User Site
                  </span>
                </div>

                <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                  <p className="font-semibold text-white flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-indigo-300" />
                    How to make this project appear on BatbayarTamir.github.io:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-300 text-[11px]">
                    <li>
                      Create a repository on your GitHub account named exactly <strong className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">BatbayarTamir.github.io</strong> (public).
                    </li>
                    <li>
                      In repository <strong className="text-white">Settings → Pages → Build and deployment</strong>, change Source from <em>Deploy from a branch</em> to <strong className="text-emerald-300">GitHub Actions</strong>.
                    </li>
                    <li>
                      Export code from AI Studio (top right <strong>Settings ⚙️ → Export to ZIP</strong>), unzip on your computer, open your computer's <strong>Terminal or PowerShell</strong> in that folder, and run:
                    </li>
                  </ol>

                  {/* Terminal snippet with Copy button */}
                  <div className="relative p-3 bg-slate-950/90 rounded-xl border border-white/15 font-mono text-[11px] text-slate-300 overflow-x-auto">
                    <button
                      type="button"
                      onClick={() => {
                        const commands = `git init\ngit add .\ngit commit -m "Deploy Romantic Sanctuary to BatbayarTamir.github.io"\ngit branch -M main\ngit remote add origin https://github.com/BatbayarTamir/BatbayarTamir.github.io.git\ngit push -u origin main --force`;
                        navigator.clipboard?.writeText(commands);
                        setCopiedCommands(true);
                        setTimeout(() => setCopiedCommands(false), 2500);
                      }}
                      className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-[10px] flex items-center gap-1 transition-all border border-white/15 cursor-pointer z-10"
                    >
                      {copiedCommands ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-300 font-sans font-semibold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span className="font-sans font-semibold">Copy Terminal Commands</span>
                        </>
                      )}
                    </button>
                    <div className="space-y-1 text-slate-300 pr-36 select-all">
                      <div className="text-emerald-400 font-sans text-[10px] font-bold"># RUN IN YOUR COMPUTER'S TERMINAL / POWERSHELL (NOT in GitHub website editor):</div>
                      <div className="text-slate-500"># 1. Initialize and commit</div>
                      <div>git init</div>
                      <div>git add .</div>
                      <div>git commit -m "Deploy Romantic Sanctuary to BatbayarTamir.github.io"</div>
                      <div className="text-slate-500 pt-1"># 2. Link your BatbayarTamir.github.io repository</div>
                      <div>git branch -M main</div>
                      <div>git remote add origin https://github.com/BatbayarTamir/BatbayarTamir.github.io.git</div>
                      <div className="text-slate-500 pt-1"># 3. Push to deploy automatically via GitHub Actions</div>
                      <div>git push -u origin main --force</div>
                    </div>
                  </div>

                  {/* If editing .github/workflows/deploy.yml in GitHub web UI */}
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Got &quot;Unexpected value &apos;git init...&apos;&quot; error on GitHub?
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const yamlContent = `name: Deploy to GitHub Pages

on: [push, workflow_dispatch]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  build-and-deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Locate project directory
        id: locate
        run: |
          if [ -f "src/main.tsx" ]; then
            echo "dir=." >> \$GITHUB_OUTPUT
            echo "Project root found at: ."
          else
            MAIN_FILE=\$(find . -maxdepth 4 -name "main.tsx" -not -path "*/node_modules/*" | head -n 1)
            if [ -n "\$MAIN_FILE" ]; then
              SRC_DIR=\$(dirname "\$MAIN_FILE")
              DIR=\$(dirname "\$SRC_DIR")
              echo "dir=\$DIR" >> \$GITHUB_OUTPUT
              echo "Project root found via src/main.tsx at: \$DIR"
            elif [ -f "package.json" ]; then
              echo "dir=." >> \$GITHUB_OUTPUT
              echo "::error::'package.json' exists, but 'src/main.tsx' is missing! Please upload the 'src/' folder to your repository."
              echo "Current directory contents:"
              ls -la
            else
              echo "::error::Neither 'src/main.tsx' nor 'package.json' was found. Please ensure your project files are pushed/uploaded to the repository."
              exit 1
            fi
          fi

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Install dependencies
        working-directory: \${{ steps.locate.outputs.dir }}
        run: npm install --legacy-peer-deps

      - name: Build
        working-directory: \${{ steps.locate.outputs.dir }}
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: \${{ steps.locate.outputs.dir == '.' && './dist' || format('{0}/dist', steps.locate.outputs.dir) }}

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`;
                          navigator.clipboard?.writeText(yamlContent);
                          setCopiedYaml(true);
                          setTimeout(() => setCopiedYaml(false), 2500);
                        }}
                        className="px-2.5 py-1 rounded bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 text-[10px] font-semibold flex items-center gap-1 transition-all border border-amber-400/30 cursor-pointer"
                      >
                        {copiedYaml ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>YAML Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Valid Workflow YAML</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      That error happens if shell commands are pasted into a GitHub Actions YAML file (<code className="font-mono bg-black/40 px-1 py-0.5 rounded text-white">.github/workflows/deploy.yml</code>) on GitHub.com. In GitHub&apos;s workflow editor, replace the content with the <strong>Valid Workflow YAML</strong> instead!
                    </p>
                  </div>
                </div>
              </div>

              {/* Settings Form */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h5 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-slate-600" />
                    Repository Connection Credentials
                  </h5>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Credentials are saved in browser storage (or environment variables). Tokens require repository content write permission.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* GitHub Owner */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Repository Owner / Username *
                    </label>
                    <input
                      type="text"
                      value={ghConfig.owner}
                      onChange={(e) => setGhConfig({ ...ghConfig, owner: e.target.value.trim() })}
                      placeholder="e.g. BatbayarTamir"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none"
                    />
                  </div>

                  {/* GitHub Repo Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Repository Name *
                    </label>
                    <input
                      type="text"
                      value={ghConfig.repo}
                      onChange={(e) => setGhConfig({ ...ghConfig, repo: e.target.value.trim() })}
                      placeholder="e.g. BatbayarTamir.github.io"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none"
                    />
                  </div>

                  {/* Branch */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <GitBranch className="w-3.5 h-3.5 text-slate-500" />
                      Branch (Default: main)
                    </label>
                    <input
                      type="text"
                      value={ghConfig.branch}
                      onChange={(e) => setGhConfig({ ...ghConfig, branch: e.target.value.trim() || 'main' })}
                      placeholder="main"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none"
                    />
                  </div>

                  {/* Resources Target Folder */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Target Folder in Repo
                    </label>
                    <input
                      type="text"
                      value={ghConfig.resourcesPath}
                      onChange={(e) => setGhConfig({ ...ghConfig, resourcesPath: e.target.value.trim() || 'resources' })}
                      placeholder="resources"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none font-mono"
                    />
                  </div>
                </div>

                {/* GitHub Personal Access Token */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                      Personal Access Token (PAT) *
                    </label>
                    <a
                      href="https://github.com/settings/tokens/new?scopes=repo&description=Romantic+Sanctuary+Resources+Sync"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-600 hover:underline flex items-center gap-0.5"
                    >
                      Generate token on GitHub <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  </div>
                  <input
                    type="password"
                    value={ghConfig.token}
                    onChange={(e) => setGhConfig({ ...ghConfig, token: e.target.value.trim() })}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx or github_pat_xxxxxxxx"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Needs permissions: <strong>Contents (Read and write)</strong> or classic <strong>repo</strong> scope.
                  </p>
                </div>

                {/* Actions & Test Status */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={ghTesting}
                      onClick={async () => {
                        setGhTesting(true);
                        setGhTestResult(null);
                        const res = await testGitHubConnection(ghConfig);
                        setGhTestResult(res);
                        setGhTesting(false);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      {ghTesting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Testing Connection...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Test Repository Access</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        saveGitHubConfig(ghConfig);
                        setGhSavedNotification(true);
                        setTimeout(() => setGhSavedNotification(false), 2500);
                      }}
                      className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
                    >
                      {ghSavedNotification ? 'Saved ✓' : 'Save Config'}
                    </button>
                  </div>

                  {ghSavedNotification && (
                    <span className="text-xs text-emerald-600 font-bold animate-in fade-in">
                      Settings saved to browser!
                    </span>
                  )}
                </div>

                {/* Connection Test Feedback */}
                {ghTestResult && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in ${
                      ghTestResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-red-50 border-red-200 text-red-900'
                    }`}
                  >
                    {ghTestResult.success ? (
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-semibold">{ghTestResult.success ? 'Success!' : 'Connection Check Failed'}</p>
                      <p className="mt-0.5 opacity-90 leading-relaxed">{ghTestResult.message}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* How it works info card */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1.5">
                <h5 className="font-bold flex items-center gap-1.5 text-amber-950">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  How Direct GitHub Repository Uploads Work:
                </h5>
                <ul className="list-disc list-inside space-y-1 text-amber-900/90 pl-1 leading-relaxed">
                  <li>
                    When you upload an image for a Polaroid memory or an MP3 audio track, it is converted to base64 and pushed directly to the GitHub REST API (<code className="font-mono text-[11px] bg-amber-100/70 px-1 py-0.5 rounded">PUT /repos/:owner/:repo/contents/:path</code>).
                  </li>
                  <li>
                    The file is saved inside your configured folder: <code className="font-mono text-[11px] bg-amber-100/70 px-1 py-0.5 rounded">{ghConfig.resourcesPath || 'resources'}/photos/</code> or <code className="font-mono text-[11px] bg-amber-100/70 px-1 py-0.5 rounded">{ghConfig.resourcesPath || 'resources'}/audio/</code>.
                  </li>
                  <li>
                    IndexedDB continues to cache your files locally for instantaneous playback and offline accessibility, while GitHub acts as your durable remote storage repository.
                  </li>
                </ul>
              </div>
            </div>
          )}

        </div>

        {/* Footer info & close */}
        <div className="px-5 sm:px-7 py-3 bg-white border-t border-rose-100 flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-slate-400">
              Hotkey: <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-bold border">~</kbd> or <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-bold border">Ctrl+P</kbd>
            </span>
          </div>

          <button
            onClick={handleClose}
            className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm transition-all"
          >
            Done & Return to Sanctuary
          </button>
        </div>

      </div>
    </div>
  );
};
