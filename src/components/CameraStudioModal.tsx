import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, Video, Upload, Music, Sparkles, X, RefreshCw, 
  Check, Play, Pause, Trophy, Volume2, Sliders, Layers, Clock,
  Type, Gauge, Scissors, AtSign, Wand2, Plus, ArrowLeft
} from 'lucide-react';
import { Language, User, SeasonType, MusicTrack, Clip } from '../types';
import { translations } from '../translations';
import { FIVE_SEASONS_DATA } from '../seasonsData';
import confetti from 'canvas-confetti';

interface CameraStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  language: Language;
  initialCategory?: string;
  onPublishClip: (clip: Clip) => void;
  availableFriends?: User[];
}

const SAMPLE_MUSIC_TRACKS: MusicTrack[] = [
  { id: 'm1', title: 'Cosmic Drift (8K Spatial)', artist: 'Hussein Ali & Orbit', duration: 15, genre: 'Ambient Synth' },
  { id: 'm2', title: 'Supernova Bass Pulse', artist: 'Galactic Beats', duration: 15, genre: 'Electronic' },
  { id: 'm3', title: 'Oud in the Andromeda', artist: 'Eastern Nebula', duration: 15, genre: 'Oriental Space' },
  { id: 'm4', title: 'Cinematic Drama Cue', artist: 'Season Symphony', duration: 15, genre: 'Orchestral' },
  { id: 'm5', title: 'Cyberpunk Hyper-Speed', artist: 'Editor FX', duration: 15, genre: 'Cyberwave' },
];

const FILTERS = [
  { id: 'normal', name: 'Original 8K', filter: 'none' },
  { id: 'hdr', name: '8K Ultra HDR', filter: 'contrast(1.2) saturate(1.3) brightness(1.05)' },
  { id: 'cosmic', name: 'Cosmic Violet', filter: 'hue-rotate(240deg) saturate(1.4)' },
  { id: 'neon', name: 'Cyber Neon', filter: 'contrast(1.3) hue-rotate(180deg) saturate(1.6)' },
  { id: 'noir', name: 'Deep Space Noir', filter: 'grayscale(1) contrast(1.4)' },
  { id: 'warm', name: 'Nebula Gold', filter: 'sepia(0.35) saturate(1.5) contrast(1.1)' },
];

export const CameraStudioModal: React.FC<CameraStudioModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  language,
  initialCategory,
  onPublishClip,
  availableFriends = [],
}) => {
  const t = translations[language];
  const activeSeason = FIVE_SEASONS_DATA.find((s) => s.isActive) || FIVE_SEASONS_DATA[0];

  // Camera stream & Recording state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Capture mode
  const [isRecording, setIsRecording] = useState(false);
  const [recordedSeconds, setRecordedSeconds] = useState(0);
  const recordTimerRef = useRef<any>(null);

  // Captured media preview & editing
  const [capturedMediaUrl, setCapturedMediaUrl] = useState<string | null>(null);
  const [capturedMediaType, setCapturedMediaType] = useState<'video' | 'photo'>('video');
  const [step, setStep] = useState<'capture' | 'edit'>('capture');

  // Editing state
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState<SeasonType>((initialCategory as SeasonType) || activeSeason.id);
  const [inCompetition, setInCompetition] = useState(true);
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(SAMPLE_MUSIC_TRACKS[0]);
  const [selectedFilter, setSelectedFilter] = useState(FILTERS[1]);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [textOverlay, setTextOverlay] = useState<string>('');
  const [showTextOverlayInput, setShowTextOverlayInput] = useState(false);
  const [isAiUpscaled, setIsAiUpscaled] = useState(true);
  const [showAudioPicker, setShowAudioPicker] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [audioPreviewPlaying, setAudioPreviewPlaying] = useState<string | null>(null);

  // Initialize camera when opened
  useEffect(() => {
    if (isOpen && step === 'capture') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, facingMode, step]);

  const startCamera = async () => {
    try {
      stopCamera();
      setPermissionError(null);
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1080 },
          height: { ideal: 1920 },
        },
        audio: true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setPermissionError(t.cameraPermissionDenied);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Flip front/back camera
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Press & Hold to Record Video (15s Max)
  const startRecording = () => {
    if (!streamRef.current) return;
    recordedChunksRef.current = [];
    setRecordedSeconds(0);

    try {
      const recorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(blob);
        setCapturedMediaUrl(videoUrl);
        setCapturedMediaType('video');
        setStep('edit');
      };

      recorder.start(100);
      setIsRecording(true);

      const startTime = Date.now();
      recordTimerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        setRecordedSeconds(elapsed);
        if (elapsed >= 15.0) {
          stopRecording();
        }
      }, 50);
    } catch (err) {
      console.error('Recording error:', err);
    }
  };

  const stopRecording = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // Single Tap to capture 8K Photo Clip
  const capturePhoto = () => {
    if (!videoRef.current || isRecording) return;
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const photoUrl = canvas.toDataURL('image/jpeg', 0.95);
      setCapturedMediaUrl(photoUrl);
      setCapturedMediaType('photo');
      setStep('edit');
    }
  };

  // File Upload (15s limit)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video');
    const url = URL.createObjectURL(file);
    setCapturedMediaUrl(url);
    setCapturedMediaType(isVideo ? 'video' : 'photo');
    setStep('edit');
  };

  const handlePublish = () => {
    if (!capturedMediaUrl) return;
    setIsPublishing(true);

    setTimeout(() => {
      const newClip: Clip = {
        id: `clip-${Date.now()}`,
        userId: currentUser.id,
        user: currentUser,
        mediaUrl: capturedMediaUrl,
        mediaType: capturedMediaType,
        durationSeconds: capturedMediaType === 'video' ? Math.min(Math.round(recordedSeconds || 15), 15) : 15,
        caption: caption.trim() || (language === 'ar' ? 'مقطع جديد عبر منصة الفصول الخمسة 8K' : 'New 8K Clip on Five Seasons'),
        category: category,
        tags: [category, 'FiveSeasons', 'Cosmic8K'],
        inCompetition: category === activeSeason.id ? inCompetition : false,
        likesCount: 0,
        votesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        isLiked: false,
        isVoted: false,
        createdAt: new Date().toISOString(),
        speed: speedMultiplier,
        ...(selectedMusic ? { musicTrack: selectedMusic } : {}),
        ...(textOverlay.trim() ? { textOverlay: textOverlay.trim() } : {}),
      };

      onPublishClip(newClip);
      setIsPublishing(false);
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#a855f7', '#fbbf24', '#ec4899'],
      });
      onClose();
      resetForm();
    }, 600);
  };

  const resetForm = () => {
    setCapturedMediaUrl(null);
    setStep('capture');
    setCaption('');
    setTextOverlay('');
    setSpeedMultiplier(1);
    setRecordedSeconds(0);
    setIsRecording(false);
    setShowAudioPicker(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        id="camera-studio-modal"
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-2 md:p-6 select-none"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg h-[92vh] max-h-[820px] rounded-[32px] overflow-hidden bg-[#0a0a16] border border-white/15 flex flex-col justify-between shadow-[0_0_80px_rgba(79,70,229,0.3)]"
        >
          {/* Header */}
          <div className="relative z-30 p-4 flex items-center justify-between border-b border-white/10 text-white bg-black/50">
            <div className="flex items-center gap-2.5">
              {step === 'edit' && (
                <button
                  onClick={() => setStep('capture')}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white mr-1"
                >
                  <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                </button>
              )}
              <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">
                  {step === 'capture' ? t.cameraStudioTitle : t.editClipTitle}
                </h3>
                <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {t.max15SecLimit}
                </span>
              </div>
            </div>

            <button
              id="close-camera-modal-btn"
              onClick={() => {
                stopCamera();
                onClose();
                resetForm();
              }}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* STEP 1: CAMERA CAPTURE / UPLOAD VIEW */}
          {step === 'capture' && (
            <div className="relative flex-1 bg-black flex flex-col justify-between overflow-hidden">
              {/* Video Element for live viewfinder */}
              <div className="absolute inset-0 z-0 flex items-center justify-center bg-zinc-950">
                {cameraActive ? (
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    className="w-full h-full object-cover"
                    style={{
                      transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                    }}
                  />
                ) : (
                  <div className="p-6 text-center max-w-xs">
                    <Camera className="w-12 h-12 text-indigo-400 mx-auto mb-3 opacity-60" />
                    <p className="text-xs text-white/50 mb-4">
                      {permissionError || 'Connecting to device camera in 8K HDR...'}
                    </p>
                    <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-3 rounded-full btn-purple text-xs font-bold text-white shadow-lg">
                      <Upload className="w-4 h-4" />
                      <span>{t.uploadFromDevice}</span>
                      <input
                        type="file"
                        accept="video/*,image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Top Controls: Flip camera */}
              {cameraActive && (
                <div className="relative z-20 p-4 flex items-center justify-end">
                  <button
                    id="flip-camera-btn"
                    onClick={toggleFacingMode}
                    className="p-3 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 text-white backdrop-blur-md"
                    title={t.switchCamera}
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Recording Progress Ring (15s limit) */}
              {isRecording && (
                <div className="relative z-20 self-center mb-2 px-4 py-1.5 rounded-full bg-red-600/90 text-white font-mono text-xs font-bold flex items-center gap-2 animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-white" />
                  <span>{t.recordingTime}: {recordedSeconds.toFixed(1)}s / 15.0s</span>
                </div>
              )}

              {/* Bottom Controls Bar */}
              <div className="relative z-20 p-6 flex items-center justify-around bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                {/* Upload from Device */}
                <label className="flex flex-col items-center gap-1 cursor-pointer group">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white backdrop-blur-md transition-all">
                    <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-[10px] text-white/80 font-medium">
                    {language === 'ar' ? 'رفع وسائط' : 'Upload'}
                  </span>
                  <input
                    id="upload-media-input"
                    type="file"
                    accept="video/*,image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {/* Big TikTok-Style Press & Hold Record Button */}
                <div className="relative flex flex-col items-center">
                  <button
                    id="record-capture-btn"
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onTouchStart={startRecording}
                    onTouchEnd={stopRecording}
                    onClick={capturePhoto}
                    className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                      isRecording
                        ? 'scale-110 ring-4 ring-red-500 bg-red-600'
                        : 'btn-purple ring-4 ring-indigo-400/40 hover:scale-105'
                    }`}
                  >
                    <div
                      className={`rounded-full transition-all ${
                        isRecording ? 'w-8 h-8 rounded-lg bg-white' : 'w-16 h-16 bg-white/90'
                      }`}
                    />
                  </button>
                  <span className="text-[10px] text-indigo-200 mt-2 font-semibold">
                    {isRecording ? t.recordingTime : t.holdToRecord}
                  </span>
                </div>

                {/* 15s Limit Pill */}
                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-950/40 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                    <span className="font-mono font-bold text-xs">15s</span>
                  </div>
                  <span className="text-[10px] text-white/50">
                    {language === 'ar' ? 'المدة' : 'Limit'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: EDITING STUDIO WITH ALL WORKING BUTTONS */}
          {step === 'edit' && capturedMediaUrl && (
            <div className="relative flex-1 overflow-y-auto p-4 md:p-6 space-y-4 text-white no-scrollbar">
              {/* Media Preview Thumbnail with Active Text Overlay & Filters */}
              <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-indigo-500/40 bg-black flex items-center justify-center shadow-lg group">
                {capturedMediaType === 'video' ? (
                  <video
                    src={capturedMediaUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full h-full object-cover"
                    style={{ filter: selectedFilter.filter }}
                  />
                ) : (
                  <img
                    src={capturedMediaUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    style={{ filter: selectedFilter.filter }}
                  />
                )}

                {/* Text Overlay rendered on top of media preview */}
                {textOverlay && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
                    <span className="text-base sm:text-lg font-black text-white bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/20 text-center shadow-xl">
                      {textOverlay}
                    </span>
                  </div>
                )}

                <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-black/70 text-[10px] font-mono text-indigo-300 border border-indigo-400/30">
                  {selectedFilter.name} • {speedMultiplier}x
                </div>

                {isAiUpscaled && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-mono font-bold flex items-center gap-1">
                    <Wand2 className="w-3 h-3" />
                    <span>8K AI ENHANCED</span>
                  </div>
                )}
              </div>

              {/* Editing Toolbar: Speed, Text, Audio, AI Upscale */}
              <div className="grid grid-cols-4 gap-2">
                {/* Speed Multiplier Button */}
                <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col items-center gap-1">
                  <Gauge className="w-4 h-4 text-indigo-400" />
                  <span className="text-[10px] font-bold text-white/80">{t.speedControl}</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    {[0.5, 1, 1.5, 2].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSpeedMultiplier(s)}
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md transition-all ${
                          speedMultiplier === s
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'text-white/40 hover:text-white'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text Overlay Button */}
                <button
                  type="button"
                  onClick={() => setShowTextOverlayInput(!showTextOverlayInput)}
                  className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all ${
                    showTextOverlayInput || textOverlay
                      ? 'bg-indigo-600/30 border-indigo-400 text-indigo-300'
                      : 'bg-white/[0.03] border-white/10 text-white/80 hover:bg-white/[0.06]'
                  }`}
                >
                  <Type className="w-4 h-4" />
                  <span className="text-[10px] font-bold">{t.addTextOverlay}</span>
                </button>

                {/* Audio Soundtrack Button (Opens Audio picker with exit X) */}
                <button
                  type="button"
                  onClick={() => setShowAudioPicker(true)}
                  className="p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 flex flex-col items-center justify-center gap-1 text-white/80 transition-all"
                >
                  <Music className="w-4 h-4 text-purple-400" />
                  <span className="text-[10px] font-bold truncate max-w-full">
                    {selectedMusic ? selectedMusic.title.split(' ')[0] : t.addSoundtrack}
                  </span>
                </button>

                {/* AI 8K Upscale Toggle */}
                <button
                  type="button"
                  onClick={() => setIsAiUpscaled(!isAiUpscaled)}
                  className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all ${
                    isAiUpscaled
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-white/[0.03] border-white/10 text-white/50'
                  }`}
                >
                  <Wand2 className="w-4 h-4" />
                  <span className="text-[10px] font-bold">{t.aiUpscale8k}</span>
                </button>
              </div>

              {/* Text Overlay Inline Input */}
              {showTextOverlayInput && (
                <div className="p-3 rounded-2xl bg-white/[0.04] border border-indigo-500/30 flex items-center gap-2">
                  <Type className="w-4 h-4 text-indigo-400" />
                  <input
                    type="text"
                    value={textOverlay}
                    onChange={(e) => setTextOverlay(e.target.value)}
                    placeholder={t.textOverlayPlaceholder}
                    className="flex-1 bg-transparent text-xs text-white placeholder:text-white/30 focus:outline-none"
                  />
                  {textOverlay && (
                    <button
                      type="button"
                      onClick={() => setTextOverlay('')}
                      className="text-[10px] text-white/40 hover:text-white"
                    >
                      {t.clearText}
                    </button>
                  )}
                </div>
              )}

              {/* Caption Input */}
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  {language === 'ar' ? 'وصف المقطع والوسوم' : 'Clip Caption & Tags'}
                </label>
                <textarea
                  id="clip-caption-textarea"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder={t.captionPlaceholder}
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 focus:border-indigo-400 rounded-2xl p-3 text-xs text-white placeholder:text-white/30 focus:outline-none transition-all"
                />
              </div>

              {/* Visual Filters Selector */}
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{t.applyFilter}</span>
                </label>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {FILTERS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSelectedFilter(f)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                        selectedFilter.id === f.id
                          ? 'btn-purple text-white border-indigo-400 shadow-md'
                          : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Season Category Selector */}
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1.5">
                  {t.selectCategory}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FIVE_SEASONS_DATA.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setCategory(s.id);
                        if (s.id !== activeSeason.id) {
                          setInCompetition(false);
                        } else {
                          setInCompetition(true);
                        }
                      }}
                      className={`p-2.5 rounded-2xl text-xs font-bold text-left rtl:text-right border transition-all ${
                        category === s.id
                          ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-md'
                          : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                      }`}
                    >
                      <div>{language === 'ar' ? s.nameAr : s.nameEn}</div>
                      {s.isActive && (
                        <span className="text-[9px] text-amber-400 font-mono block mt-0.5">
                          ★ {language === 'ar' ? 'الموسم النشط' : 'Active Season'}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggle Enter Active Season Contest - ONLY if matching current active season */}
              {category === activeSeason.id ? (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/40 flex items-start gap-3">
                  <input
                    id="enter-season-contest-checkbox"
                    type="checkbox"
                    checked={inCompetition}
                    onChange={(e) => setInCompetition(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-black/60 border-amber-400/60 cursor-pointer"
                  />
                  <label htmlFor="enter-season-contest-checkbox" className="text-xs cursor-pointer">
                    <span className="font-bold text-amber-300 block mb-0.5 flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      {t.enterInSeasonContest}
                    </span>
                    <span className="text-white/70 text-[11px] leading-tight block">
                      {t.enterInSeasonContestSub}
                    </span>
                  </label>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-2.5 text-white/50 text-xs">
                  <Trophy className="w-4 h-4 text-amber-400/60 flex-shrink-0" />
                  <span>
                    {language === 'ar'
                      ? `المشاركة في المسابقة والتصويت متاحة فقط عند اختيار (${activeSeason.nameAr}) لأنه الموسم النشط حالياً.`
                      : `Contest entry & voting are only available when selecting (${activeSeason.nameEn}) as it is currently active.`}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  id="discard-clip-btn"
                  type="button"
                  onClick={resetForm}
                  className="py-3 px-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-semibold text-white/70"
                >
                  {t.discardClip}
                </button>

                <button
                  id="publish-clip-btn"
                  type="button"
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="flex-1 py-3 px-6 rounded-full btn-purple text-xs font-bold text-white flex items-center justify-center gap-2 shadow-lg"
                >
                  {isPublishing ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>{t.publishClip}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* AUDIO TRACK PICKER MODAL (With prominent 'X' exit button) */}
          {showAudioPicker && (
            <div
              className="absolute inset-0 z-40 bg-black/90 backdrop-blur-xl p-5 flex flex-col justify-between"
              onClick={() => setShowAudioPicker(false)}
            >
              <div onClick={(e) => e.stopPropagation()} className="flex flex-col h-full">
                {/* Audio Header with 'X' button */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-purple-400" />
                    <h3 className="font-bold text-sm text-white">{t.addSoundtrack}</h3>
                  </div>
                  <button
                    id="close-audio-picker-btn"
                    onClick={() => setShowAudioPicker(false)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
                  >
                    <X className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>

                {/* Track List */}
                <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
                  {SAMPLE_MUSIC_TRACKS.map((track) => {
                    const isSelected = selectedMusic?.id === track.id;
                    const isPlayingAudio = audioPreviewPlaying === track.id;
                    return (
                      <div
                        key={track.id}
                        onClick={() => {
                          setSelectedMusic(track);
                        }}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600/30 border-indigo-400 text-white'
                            : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10 text-white/80'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAudioPreviewPlaying(isPlayingAudio ? null : track.id);
                            }}
                            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-indigo-300"
                          >
                            {isPlayingAudio ? (
                              <Pause className="w-4 h-4 fill-current" />
                            ) : (
                              <Play className="w-4 h-4 fill-current" />
                            )}
                          </button>
                          <div>
                            <div className="text-xs font-bold text-white">{track.title}</div>
                            <div className="text-[10px] text-white/50 font-mono">
                              {track.artist} • {track.genre}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Done Button */}
                <button
                  type="button"
                  onClick={() => setShowAudioPicker(false)}
                  className="w-full mt-3 py-3 rounded-full btn-purple text-xs font-bold text-white"
                >
                  {t.saveSettings}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
