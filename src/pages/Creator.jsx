import { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import {
  Sparkles,
  Heart,
  Image as ImageIcon,
  Music2,
  Stars,
  Lock,
  Palette,
  Save,
  Eye,
  FileJson,
  Download,
  Upload,
  RefreshCw,
  GripVertical,
  Volume2,
  VolumeX
} from "lucide-react";
import { defaultConfig } from "../data/defaultConfig";
import { playChimeSound } from "../lib/soundEffects";
import {
  getActiveConfig,
  saveMetadata,
  exportMetadataDownload,
  uploadMediaFile,
  clearConfig
} from "../lib/configLoader";
import { saveConfig } from "../lib/storage";
import { IS_DEV } from "../lib/env";

const palettes = [
  { id: "rose", label: "Rose Mist" },
  { id: "lavender", label: "Lavender Moon" },
  { id: "peach", label: "Peach Glow" }
];

const unlockOptions = [
  { id: "scroll", label: "Scroll to Reveal" },
  { id: "time", label: "Time Delay" },
  { id: "click", label: "Heart Clicks" }
];

export default function Creator() {
  const navigate = useNavigate();

  // Guard: if not in dev mode, creator mode is disabled
  if (!IS_DEV) {
    return <Navigate to="/" replace />;
  }

  const initial = useMemo(() => getActiveConfig(), []);
  const [config, setConfig] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  // Drag and drop ordering states
  const [activeDragId, setActiveDragId] = useState(null);
  const [draggedPhoto, setDraggedPhoto] = useState(null);
  const [dragOverPhoto, setDragOverPhoto] = useState(null);
  const [draggedTimeline, setDraggedTimeline] = useState(null);
  const [dragOverTimeline, setDragOverTimeline] = useState(null);
  const [draggedPromise, setDraggedPromise] = useState(null);
  const [dragOverPromise, setDragOverPromise] = useState(null);
  const [draggedFuture, setDraggedFuture] = useState(null);
  const [dragOverFuture, setDragOverFuture] = useState(null);

  const reorderItem = (type, fromIndex, toIndex) => {
    if (fromIndex === toIndex || fromIndex < 0) return;
    setConfig((prev) => {
      const list = [...prev[type]];
      if (toIndex < 0 || toIndex >= list.length) return prev;
      const [item] = list.splice(fromIndex, 1);
      list.splice(toIndex, 0, item);
      return { ...prev, [type]: list };
    });
  };

  const handleDragStart = (type, index, e) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `${type}:${index}`);
    if (type === "photos") setDraggedPhoto(index);
    if (type === "timeline") setDraggedTimeline(index);
    if (type === "promises") setDraggedPromise(index);
    if (type === "futureCards") setDraggedFuture(index);
  };

  const handleDragOver = (type, index, e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (type === "photos" && dragOverPhoto !== index) setDragOverPhoto(index);
    if (type === "timeline" && dragOverTimeline !== index) setDragOverTimeline(index);
    if (type === "promises" && dragOverPromise !== index) setDragOverPromise(index);
    if (type === "futureCards" && dragOverFuture !== index) setDragOverFuture(index);
  };

  const handleDrop = (type, targetIndex, e) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("text/plain");
    const [dragType, fromIndexStr] = data.split(":");
    if (dragType !== type) return;
    const fromIndex = parseInt(fromIndexStr, 10);
    if (!isNaN(fromIndex) && fromIndex !== targetIndex) {
      reorderItem(type, fromIndex, targetIndex);
    }
    handleDragEnd(type);
  };

  const handleDragEnd = (type) => {
    setActiveDragId(null);
    if (type === "photos") {
      setDraggedPhoto(null);
      setDragOverPhoto(null);
    }
    if (type === "timeline") {
      setDraggedTimeline(null);
      setDragOverTimeline(null);
    }
    if (type === "promises") {
      setDraggedPromise(null);
      setDragOverPromise(null);
    }
    if (type === "futureCards") {
      setDraggedFuture(null);
      setDragOverFuture(null);
    }
  };

  const updateField = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const updateNested = (parent, nextValues) => {
    setConfig((prev) => ({
      ...prev,
      [parent]: { ...(prev[parent] || {}), ...nextValues }
    }));
  };

  const updateTimeline = (index, nextValues) => {
    setConfig((prev) => {
      const next = [...prev.timeline];
      next[index] = { ...next[index], ...nextValues };
      return { ...prev, timeline: next };
    });
  };

  const addTimelineEvent = () => {
    setConfig((prev) => ({
      ...prev,
      timeline: [
        ...prev.timeline,
        {
          title: "New Chapter",
          date: new Date().toISOString().slice(0, 10),
          emoji: "✨",
          description: "A memory we will always cherish."
        }
      ]
    }));
  };

  const removeTimelineEvent = (index) => {
    setConfig((prev) => ({
      ...prev,
      timeline: prev.timeline.filter((_, i) => i !== index)
    }));
  };

  const updatePhoto = (index, nextValues) => {
    setConfig((prev) => {
      const next = [...prev.photos];
      next[index] = { ...next[index], ...nextValues };
      return { ...prev, photos: next };
    });
  };

  const addPhotoSlot = () => {
    setConfig((prev) => ({
      ...prev,
      photos: [
        ...prev.photos,
        {
          src: `/photos/photo-${prev.photos.length + 1}.jpg`,
          caption: "A beautiful memory"
        }
      ]
    }));
  };

  const removePhoto = (index) => {
    setConfig((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const movePhoto = (from, to) => {
    setConfig((prev) => {
      const next = [...prev.photos];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return { ...prev, photos: next };
    });
  };

  const updatePromise = (index, value) => {
    setConfig((prev) => {
      const next = [...prev.promises];
      next[index] = value;
      return { ...prev, promises: next };
    });
  };

  const addPromise = () => {
    setConfig((prev) => ({
      ...prev,
      promises: [...prev.promises, "I promise to always choose you."]
    }));
  };

  const removePromise = (index) => {
    setConfig((prev) => ({
      ...prev,
      promises: prev.promises.filter((_, i) => i !== index)
    }));
  };

  const updateFutureCard = (index, nextValues) => {
    setConfig((prev) => {
      const next = [...prev.futureCards];
      next[index] = { ...next[index], ...nextValues };
      return { ...prev, futureCards: next };
    });
  };

  const addFutureCard = () => {
    setConfig((prev) => ({
      ...prev,
      futureCards: [
        ...prev.futureCards,
        {
          title: "Future Memory",
          icon: "🌟",
          description: "Another beautiful dream we will bring to life."
        }
      ]
    }));
  };

  const removeFutureCard = (index) => {
    setConfig((prev) => ({
      ...prev,
      futureCards: prev.futureCards.filter((_, i) => i !== index)
    }));
  };

  const handlePhotoUpload = async (index, file) => {
    if (!file) return;
    try {
      setUploading(true);
      const filePath = await uploadMediaFile(file, "photos");
      updatePhoto(index, { src: filePath });
      setStatusMessage(`Photo saved directly to ${filePath} (no base64)!`);
    } catch (error) {
      console.error("Photo upload failed", error);
      setStatusMessage("Photo upload failed. Try manual copy to public/photos/");
    } finally {
      setUploading(false);
      setTimeout(() => setStatusMessage(""), 4000);
    }
  };

  const handleAudioUpload = async (file) => {
    if (!file) return;
    try {
      setUploading(true);
      const filePath = await uploadMediaFile(file, "music");
      updateNested("music", { source: filePath });
      setStatusMessage(`Audio saved directly to ${filePath}!`);
    } catch (error) {
      console.error("Audio upload failed", error);
      setStatusMessage("Audio upload failed. Try manual copy to public/music/");
    } finally {
      setUploading(false);
      setTimeout(() => setStatusMessage(""), 4000);
    }
  };

  const [testingSecretAudio, setTestingSecretAudio] = useState(false);
  const secretAudioTestRef = useRef(null);

  const toggleTestSecretAudio = () => {
    if (testingSecretAudio) {
      if (secretAudioTestRef.current) {
        secretAudioTestRef.current.pause();
        secretAudioTestRef.current.currentTime = 0;
      }
      setTestingSecretAudio(false);
      return;
    }

    const src = config.secretAudio?.source;
    const vol = config.secretAudio?.volume ?? 0.8;

    if (src) {
      if (!secretAudioTestRef.current || secretAudioTestRef.current.src !== src) {
        if (secretAudioTestRef.current) {
          secretAudioTestRef.current.pause();
        }
        secretAudioTestRef.current = new Audio(src);
      }
      const audio = secretAudioTestRef.current;
      audio.volume = vol;
      audio.currentTime = 0;
      audio.onended = () => setTestingSecretAudio(false);
      audio.onerror = () => {
        setTestingSecretAudio(false);
        playChimeSound(vol);
      };
      audio.play().then(() => setTestingSecretAudio(true)).catch(() => {
        setTestingSecretAudio(false);
        playChimeSound(vol);
      });
    } else {
      playChimeSound(vol);
      setTestingSecretAudio(true);
      setTimeout(() => setTestingSecretAudio(false), 2000);
    }
  };

  const handleSecretAudioUpload = async (file) => {
    if (!file) return;
    try {
      setUploading(true);
      const filePath = await uploadMediaFile(file, "music");
      updateNested("secretAudio", { source: filePath });
      setStatusMessage(`Secret audio saved directly to ${filePath}!`);
    } catch (error) {
      console.error("Secret audio upload failed", error);
      setStatusMessage("Audio upload failed. Try manual copy to public/music/");
    } finally {
      setUploading(false);
      setTimeout(() => setStatusMessage(""), 4000);
    }
  };

  useEffect(() => {
    return () => {
      if (secretAudioTestRef.current) {
        secretAudioTestRef.current.pause();
        secretAudioTestRef.current = null;
      }
    };
  }, []);

  const handleSaveToMetadata = async () => {
    setSaving(true);
    const result = await saveMetadata(config);
    setSaving(false);
    if (result.savedToFile) {
      setStatusMessage("Successfully saved to metadata.json in project & draft!");
    } else {
      setStatusMessage("Saved draft to browser storage. Exporting metadata.json file...");
      exportMetadataDownload(config);
    }
    setTimeout(() => setStatusMessage(""), 4000);
  };

  const handleDownloadMetadata = () => {
    exportMetadataDownload(config);
    setStatusMessage("metadata.json downloaded successfully.");
    setTimeout(() => setStatusMessage(""), 3500);
  };

  const handleImportJson = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        setConfig(parsed);
        saveConfig(parsed);
        setStatusMessage("Imported metadata successfully.");
      } catch (error) {
        console.error(error);
        alert("Invalid JSON file.");
      }
      setTimeout(() => setStatusMessage(""), 3500);
    };
    reader.readAsText(file);
  };

  const saveAndPreview = async () => {
    setSaving(true);
    await saveMetadata(config);
    setTimeout(() => {
      setSaving(false);
      navigate("/anniversary");
    }, 400);
  };

  return (
    <div className="min-h-screen bg-aurora-soft px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-10">
        <header className="space-y-3 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/70 px-4 py-1 text-xs uppercase tracking-[0.3em] text-rose-500">
            <Sparkles className="h-4 w-4" /> Creator Studio (Dev Mode)
          </div>
          <h1 className="font-display text-4xl sm:text-5xl">Craft Your Forever Experience</h1>
          <p className="text-sm text-slate-600 sm:text-base">
            Customize every moment for your 1st anniversary and upcoming marriage. Changes save directly to{" "}
            <code className="rounded bg-rose-100 px-1.5 py-0.5 text-xs text-rose-800">metadata.json</code>{" "}
            and images are stored cleanly in{" "}
            <code className="rounded bg-rose-100 px-1.5 py-0.5 text-xs text-rose-800">public/photos/</code>.
          </p>
        </header>

        <section className="glass rounded-3xl p-6 shadow-glow sm:p-10">
          <div className="flex items-center justify-between border-b border-white/60 pb-6">
            <div>
              <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Step 1</span>
              <h2 className="font-display text-2xl">The Essentials</h2>
            </div>
            <span className="text-sm uppercase tracking-[0.4em] text-rose-500">Dev Mode Active</span>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-xs font-medium text-slate-500">Your Name</label>
              <input
                className="mt-2 w-full rounded-2xl border border-white/70 bg-white/70 px-4 py-3"
                value={config.creatorName}
                onChange={(event) => updateField("creatorName", event.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Her Name</label>
              <input
                className="mt-2 w-full rounded-2xl border border-white/70 bg-white/70 px-4 py-3"
                value={config.partnerName}
                onChange={(event) => updateField("partnerName", event.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Relationship Start Date</label>
              <input
                type="date"
                className="mt-2 w-full rounded-2xl border border-white/70 bg-white/70 px-4 py-3"
                value={config.relationshipStartDate || config.anniversaryDate}
                onChange={(event) => updateField("relationshipStartDate", event.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Anniversary Date</label>
              <input
                type="date"
                className="mt-2 w-full rounded-2xl border border-white/70 bg-white/70 px-4 py-3"
                value={config.anniversaryDate}
                onChange={(event) => updateField("anniversaryDate", event.target.value)}
              />
            </div>
          </div>

          <div className="mt-8 rounded-2xl bg-white/60 p-4 text-center text-sm text-slate-600">
            Previewing story for:{" "}
            <span className="font-semibold text-rose-600">
              {config.creatorName || "You"} ❤️ {config.partnerName || "Your Love"}
            </span>
          </div>
        </section>

        <section className="glass rounded-3xl p-6 shadow-glow sm:p-10">
          <div className="border-b border-white/60 pb-6">
            <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Step 2</span>
            <h2 className="font-display text-2xl">Media & Words</h2>
          </div>

          <div className="mt-8 grid gap-10 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ImageIcon className="h-5 w-5 text-rose-400" />
                  <h2 className="font-display text-2xl">Photos</h2>
                </div>
                <span className="text-xs text-slate-400">Drag ⠿ to reorder</span>
              </div>
              <p className="text-xs text-slate-500">
                Uploaded photos are saved into <code className="text-rose-600">public/photos/</code>. No base64 strings!
              </p>
              <div className="space-y-4">
                {config.photos.map((photo, index) => (
                  <div
                    key={`photo-${index}`}
                    draggable={activeDragId === `photos-${index}`}
                    onDragStart={(e) => handleDragStart("photos", index, e)}
                    onDragOver={(e) => handleDragOver("photos", index, e)}
                    onDrop={(e) => handleDrop("photos", index, e)}
                    onDragEnd={() => handleDragEnd("photos")}
                    className={`rounded-2xl border p-4 transition-all duration-200 ${
                      dragOverPhoto === index && draggedPhoto !== index
                        ? "border-rose-400 ring-2 ring-rose-200 bg-rose-50/70"
                        : "border-white/70 bg-white/70"
                    } ${draggedPhoto === index ? "opacity-40 scale-[0.98]" : ""}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="cursor-grab active:cursor-grabbing rounded-lg p-1 text-slate-400 hover:bg-white/80 hover:text-rose-500 transition-colors"
                          title="Drag to reorder"
                          onMouseDown={() => setActiveDragId(`photos-${index}`)}
                          onMouseUp={() => setActiveDragId(null)}
                        >
                          <GripVertical className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-slate-500">Memory {index + 1}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="rounded-full border border-white/70 px-3 py-1 text-xs"
                          onClick={() => index > 0 && movePhoto(index, index - 1)}
                        >
                          Up
                        </button>
                        <button
                          className="rounded-full border border-white/70 px-3 py-1 text-xs"
                          onClick={() =>
                            index < config.photos.length - 1 && movePhoto(index, index + 1)
                          }
                        >
                          Down
                        </button>
                        <button
                          className="text-xs text-rose-500 hover:underline px-1"
                          onClick={() => removePhoto(index)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <input
                        placeholder="/photos/photo-1.jpg or hosted URL"
                        className="w-full rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-sm"
                        value={photo.src}
                        onChange={(event) => updatePhoto(index, { src: event.target.value })}
                      />
                      <input
                        placeholder="Caption"
                        className="w-full rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-sm"
                        value={photo.caption}
                        onChange={(event) => updatePhoto(index, { caption: event.target.value })}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => handlePhotoUpload(index, event.target.files[0])}
                      />
                      {photo.src ? (
                        <img
                          src={photo.src}
                          alt="preview"
                          className="h-16 w-16 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/60 text-xs text-slate-400">
                          Preview
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  className="rounded-full border border-white/70 px-4 py-2 text-sm"
                  onClick={addPhotoSlot}
                >
                  Add another photo
                </button>
              </div>

              <div className="flex items-center gap-3">
                <Music2 className="h-5 w-5 text-rose-400" />
                <h2 className="font-display text-2xl">Music</h2>
              </div>
              <div className="space-y-3">
                <input
                  placeholder="/music/our-song.mp3 or external audio URL"
                  className="w-full rounded-2xl border border-white/70 bg-white/70 px-4 py-3"
                  value={config.music.source}
                  onChange={(event) => updateNested("music", { source: event.target.value })}
                />
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(event) => handleAudioUpload(event.target.files[0])}
                />
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500">Volume</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={config.music.volume}
                    onChange={(event) =>
                      updateNested("music", { volume: Number(event.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-rose-200/60 bg-white/50 p-5 backdrop-blur-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Heart className="h-5 w-5 text-rose-500" />
                    <h2 className="font-display text-xl">Double-Click Audio Note</h2>
                  </div>
                  <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-semibold text-rose-600">
                    &quot;Double click me&quot;
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Plays a special audio message or cute chime when your partner double-clicks the &quot;Double click me&quot; button in Tiny Rituals.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600">Audio Source (URL or file)</label>
                    <input
                      placeholder="/music/secret-whisper.mp3 or external audio URL"
                      className="mt-1 w-full rounded-2xl border border-white/70 bg-white/80 px-4 py-2.5 text-sm"
                      value={config.secretAudio?.source || ""}
                      onChange={(event) =>
                        updateNested("secretAudio", { source: event.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600">Upload Audio File (.mp3, .m4a, voice memo)</label>
                    <input
                      type="file"
                      accept="audio/*"
                      className="mt-1 block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-rose-50 file:text-rose-600 hover:file:bg-rose-100 cursor-pointer"
                      onChange={(event) => handleSecretAudioUpload(event.target.files[0])}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-500">Volume</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={config.secretAudio?.volume ?? 0.8}
                        onChange={(event) =>
                          updateNested("secretAudio", { volume: Number(event.target.value) })
                        }
                      />
                      <span className="text-xs text-slate-400">
                        {Math.round((config.secretAudio?.volume ?? 0.8) * 100)}%
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={toggleTestSecretAudio}
                      className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition shadow-sm"
                    >
                      {testingSecretAudio ? (
                        <>
                          <VolumeX className="h-3.5 w-3.5" /> Stop Preview
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-3.5 w-3.5" /> Test Audio
                        </>
                      )}
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600">Whisper Message Text</label>
                    <input
                      placeholder="You are my favorite forever. 💖"
                      className="mt-1 w-full rounded-2xl border border-white/70 bg-white/80 px-4 py-2.5 text-sm"
                      value={config.secretAudio?.message ?? "You are my favorite forever. 💖"}
                      onChange={(event) =>
                        updateNested("secretAudio", { message: event.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600">Button Label</label>
                    <input
                      placeholder="Double click me"
                      className="mt-1 w-full rounded-2xl border border-white/70 bg-white/80 px-4 py-2.5 text-sm"
                      value={config.secretAudio?.buttonText ?? "Double click me"}
                      onChange={(event) =>
                        updateNested("secretAudio", { buttonText: event.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Stars className="h-5 w-5 text-rose-400" />
                <h2 className="font-display text-2xl">Love Letter</h2>
              </div>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    className={`rounded-full px-4 py-2 text-xs uppercase tracking-widest ${config.letterMode === "short"
                        ? "bg-rose-500 text-white"
                        : "border border-white/70"
                      }`}
                    onClick={() => updateField("letterMode", "short")}
                  >
                    Short
                  </button>
                  <button
                    className={`rounded-full px-4 py-2 text-xs uppercase tracking-widest ${config.letterMode === "long"
                        ? "bg-rose-500 text-white"
                        : "border border-white/70"
                      }`}
                    onClick={() => updateField("letterMode", "long")}
                  >
                    Long
                  </button>
                </div>
                {config.letterMode === "short" ? (
                  <textarea
                    rows={4}
                    className="w-full rounded-2xl border border-white/70 bg-white/70 p-4"
                    value={config.shortLetter}
                    onChange={(event) => updateField("shortLetter", event.target.value)}
                  />
                ) : (
                  <textarea
                    rows={7}
                    className="w-full rounded-2xl border border-white/70 bg-white/70 p-4"
                    value={config.longLetter}
                    onChange={(event) => updateField("longLetter", event.target.value)}
                  />
                )}
              </div>

              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-rose-400" />
                <h2 className="font-display text-2xl">Surprise Settings</h2>
              </div>
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  {unlockOptions.map((option) => (
                    <button
                      key={option.id}
                      className={`rounded-2xl border px-3 py-2 text-xs ${config.surprise.unlock === option.id
                          ? "border-rose-400 bg-rose-50"
                          : "border-white/70 bg-white/60"
                        }`}
                      onClick={() => updateNested("surprise", { unlock: option.id })}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {config.surprise.unlock === "click" && (
                  <div>
                    <label className="text-xs font-medium text-slate-500">Clicks to unlock</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      className="mt-2 w-full rounded-2xl border border-white/70 bg-white/70 px-4 py-3"
                      value={config.surprise.clickCount}
                      onChange={(event) =>
                        updateNested("surprise", { clickCount: Number(event.target.value) })
                      }
                    />
                  </div>
                )}
                {config.surprise.unlock === "time" && (
                  <div>
                    <label className="text-xs font-medium text-slate-500">Delay seconds</label>
                    <input
                      type="number"
                      min={3}
                      max={60}
                      className="mt-2 w-full rounded-2xl border border-white/70 bg-white/70 px-4 py-3"
                      value={config.surprise.delaySeconds}
                      onChange={(event) =>
                        updateNested("surprise", { delaySeconds: Number(event.target.value) })
                      }
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Palette className="h-5 w-5 text-rose-400" />
                <h2 className="font-display text-2xl">Theme</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {palettes.map((palette) => (
                  <button
                    key={palette.id}
                    className={`rounded-2xl border px-4 py-3 text-sm ${config.theme.palette === palette.id
                        ? "border-rose-400 bg-rose-50"
                        : "border-white/70 bg-white/60"
                      }`}
                    onClick={() => updateNested("theme", { palette: palette.id })}
                  >
                    {palette.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <FileJson className="h-5 w-5 text-rose-400" />
                <h2 className="font-display text-2xl">Netlify & metadata.json</h2>
              </div>
              <div className="space-y-4 rounded-2xl bg-white/70 p-4">
                <p className="text-sm text-slate-600">
                  In Dev Mode, your data saves to{" "}
                  <code className="text-rose-600 font-semibold">src/data/metadata.json</code> &{" "}
                  <code className="text-rose-600 font-semibold">public/metadata.json</code>. When deployed on Netlify, the site reads this file directly.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    className="flex items-center gap-2 rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm text-rose-700 hover:bg-rose-100"
                    onClick={handleSaveToMetadata}
                  >
                    <Save className="h-4 w-4" /> Save to metadata.json
                  </button>
                  <button
                    className="flex items-center gap-2 rounded-full border border-white/70 px-4 py-2 text-sm"
                    onClick={handleDownloadMetadata}
                  >
                    <Download className="h-4 w-4" /> Export metadata.json
                  </button>
                  <label className="flex cursor-pointer items-center gap-2 rounded-full border border-white/70 px-4 py-2 text-sm">
                    <Upload className="h-4 w-4" /> Import metadata.json
                    <input
                      type="file"
                      accept="application/json"
                      className="hidden"
                      onChange={(event) => handleImportJson(event.target.files[0])}
                    />
                  </label>
                  <button
                    className="flex items-center gap-2 rounded-full border border-white/70 px-4 py-2 text-sm text-slate-600"
                    onClick={() => {
                      clearConfig();
                      setConfig(initial);
                      setStatusMessage("Reloaded from metadata.json");
                      setTimeout(() => setStatusMessage(""), 3500);
                    }}
                  >
                    <RefreshCw className="h-4 w-4" /> Reload from file
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Section */}
          <div className="mt-12 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="font-display text-2xl">Our Story Timeline</h2>
                <span className="text-xs text-slate-400">Drag ⠿ to reorder</span>
              </div>
              <button
                className="rounded-full border border-white/70 px-4 py-2 text-sm"
                onClick={addTimelineEvent}
              >
                Add Timeline Moment
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {config.timeline.map((item, index) => (
                <div
                  key={`timeline-${index}`}
                  draggable={activeDragId === `timeline-${index}`}
                  onDragStart={(e) => handleDragStart("timeline", index, e)}
                  onDragOver={(e) => handleDragOver("timeline", index, e)}
                  onDrop={(e) => handleDrop("timeline", index, e)}
                  onDragEnd={() => handleDragEnd("timeline")}
                  className={`rounded-2xl border p-4 space-y-3 transition-all duration-200 ${
                    dragOverTimeline === index && draggedTimeline !== index
                      ? "border-rose-400 ring-2 ring-rose-200 bg-rose-50/70"
                      : "border-white/70 bg-white/70"
                  } ${draggedTimeline === index ? "opacity-40 scale-[0.98]" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="cursor-grab active:cursor-grabbing rounded-lg p-1 text-slate-400 hover:bg-white/80 hover:text-rose-500 transition-colors"
                        title="Drag to reorder"
                        onMouseDown={() => setActiveDragId(`timeline-${index}`)}
                        onMouseUp={() => setActiveDragId(null)}
                      >
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <input
                        className="w-16 rounded-xl border border-white/60 bg-white/80 px-2 py-1 text-center text-xl"
                        value={item.emoji}
                        onChange={(e) => updateTimeline(index, { emoji: e.target.value })}
                      />
                    </div>
                    <button
                      className="text-xs text-rose-500 hover:underline"
                      onClick={() => removeTimelineEvent(index)}
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    placeholder="Title"
                    className="w-full rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-sm font-semibold"
                    value={item.title}
                    onChange={(e) => updateTimeline(index, { title: e.target.value })}
                  />
                  <input
                    type="date"
                    className="w-full rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-sm"
                    value={item.date}
                    onChange={(e) => updateTimeline(index, { date: e.target.value })}
                  />
                  <textarea
                    rows={2}
                    placeholder="Description"
                    className="w-full rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-sm"
                    value={item.description}
                    onChange={(e) => updateTimeline(index, { description: e.target.value })}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Promises Section */}
          <div className="mt-12 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="font-display text-2xl">Lifelong Promises</h2>
                <span className="text-xs text-slate-400">Drag ⠿ to reorder</span>
              </div>
              <button
                className="rounded-full border border-white/70 px-4 py-2 text-sm"
                onClick={addPromise}
              >
                Add Promise
              </button>
            </div>
            <div className="space-y-3">
              {config.promises.map((promise, index) => (
                <div
                  key={`promise-${index}`}
                  draggable={activeDragId === `promises-${index}`}
                  onDragStart={(e) => handleDragStart("promises", index, e)}
                  onDragOver={(e) => handleDragOver("promises", index, e)}
                  onDrop={(e) => handleDrop("promises", index, e)}
                  onDragEnd={() => handleDragEnd("promises")}
                  className={`flex items-center gap-2 rounded-2xl border p-1 transition-all duration-200 ${
                    dragOverPromise === index && draggedPromise !== index
                      ? "border-rose-400 ring-2 ring-rose-200 bg-rose-50/70"
                      : "border-transparent"
                  } ${draggedPromise === index ? "opacity-40 scale-[0.98]" : ""}`}
                >
                  <div
                    className="cursor-grab active:cursor-grabbing rounded-lg p-2 text-slate-400 hover:bg-white/80 hover:text-rose-500 transition-colors"
                    title="Drag to reorder"
                    onMouseDown={() => setActiveDragId(`promises-${index}`)}
                    onMouseUp={() => setActiveDragId(null)}
                  >
                    <GripVertical className="h-4 w-4" />
                  </div>
                  <input
                    className="flex-1 rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm"
                    value={promise}
                    onChange={(e) => updatePromise(index, e.target.value)}
                  />
                  <button
                    className="rounded-full border border-white/70 px-3 py-2 text-xs text-rose-500"
                    onClick={() => removePromise(index)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Future Cards Section */}
          <div className="mt-12 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="font-display text-2xl">Future Dreams</h2>
                <span className="text-xs text-slate-400">Drag ⠿ to reorder</span>
              </div>
              <button
                className="rounded-full border border-white/70 px-4 py-2 text-sm"
                onClick={addFutureCard}
              >
                Add Future Card
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {config.futureCards.map((card, index) => (
                <div
                  key={`future-${index}`}
                  draggable={activeDragId === `futureCards-${index}`}
                  onDragStart={(e) => handleDragStart("futureCards", index, e)}
                  onDragOver={(e) => handleDragOver("futureCards", index, e)}
                  onDrop={(e) => handleDrop("futureCards", index, e)}
                  onDragEnd={() => handleDragEnd("futureCards")}
                  className={`rounded-2xl border p-4 space-y-3 transition-all duration-200 ${
                    dragOverFuture === index && draggedFuture !== index
                      ? "border-rose-400 ring-2 ring-rose-200 bg-rose-50/70"
                      : "border-white/70 bg-white/70"
                  } ${draggedFuture === index ? "opacity-40 scale-[0.98]" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="cursor-grab active:cursor-grabbing rounded-lg p-1 text-slate-400 hover:bg-white/80 hover:text-rose-500 transition-colors"
                        title="Drag to reorder"
                        onMouseDown={() => setActiveDragId(`futureCards-${index}`)}
                        onMouseUp={() => setActiveDragId(null)}
                      >
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <input
                        className="w-14 rounded-xl border border-white/60 bg-white/80 px-2 py-1 text-center text-xl"
                        value={card.icon}
                        onChange={(e) => updateFutureCard(index, { icon: e.target.value })}
                      />
                    </div>
                    <button
                      className="text-xs text-rose-500 hover:underline"
                      onClick={() => removeFutureCard(index)}
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    placeholder="Title"
                    className="w-full rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-sm font-semibold"
                    value={card.title}
                    onChange={(e) => updateFutureCard(index, { title: e.target.value })}
                  />
                  <textarea
                    rows={3}
                    placeholder="Description"
                    className="w-full rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-sm"
                    value={card.description}
                    onChange={(e) => updateFutureCard(index, { description: e.target.value })}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-3">
              <button
                className="rounded-full border border-white/70 px-4 py-2 text-sm"
                onClick={() => {
                  clearConfig();
                  setConfig(defaultConfig);
                }}
              >
                Reset to Default
              </button>
              <button
                className="flex items-center gap-2 rounded-full border border-white/70 px-4 py-2 text-sm"
                onClick={() => {
                  saveConfig(config);
                  setStatusMessage("Draft saved in browser.");
                  setTimeout(() => setStatusMessage(""), 3500);
                }}
              >
                <Save className="h-4 w-4" /> Save draft
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                className="flex items-center gap-2 rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm text-rose-700"
                onClick={handleSaveToMetadata}
              >
                <FileJson className="h-4 w-4" /> Save to metadata.json
              </button>
              <button
                className="flex items-center gap-2 rounded-full border border-white/70 px-4 py-2 text-sm"
                onClick={() => navigate("/anniversary")}
              >
                <Eye className="h-4 w-4" /> Preview
              </button>
              <button
                className="flex items-center gap-2 rounded-full bg-rose-500 px-5 py-2 text-sm text-white shadow-glow"
                onClick={saveAndPreview}
              >
                <Heart className="h-4 w-4" />
                {saving ? "Saving..." : "Save & View Experience"}
              </button>
            </div>
          </div>
          {statusMessage && (
            <div className="mt-4 rounded-2xl bg-white/80 px-4 py-3 text-sm text-slate-700 font-medium">
              {statusMessage}
            </div>
          )}
          {uploading && (
            <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Saving file directly to folder...
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
