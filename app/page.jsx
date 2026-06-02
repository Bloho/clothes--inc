"use client";

import { upload as uploadBlob } from "@vercel/blob/client";
import { useEffect, useRef, useState } from "react";
import { categories } from "../lib/categories";

const emptySession = {
  aiAvailable: false,
  authSecretConfigured: false,
  blobConfigured: false,
  databaseConfigured: false,
  googleConfigured: false,
  loading: true,
  user: null,
};

const emptyUpload = {
  brand: "",
  category: categories[0],
  color: "",
  name: "",
  sortMode: "manual",
};

export default function Home() {
  const [session, setSession] = useState(emptySession);
  const [items, setItems] = useState([]);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [upload, setUpload] = useState(emptyUpload);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const fileInputRef = useRef(null);

  const activeItem = activeIndex === null ? null : items[activeIndex];
  const hasModal = activeIndex !== null || isUploadOpen;
  
  useEffect(() => {
    let cancelled = false;

    async function loadApp() {
      const sessionResponse = await fetch("/api/auth/session");
      const nextSession = await sessionResponse.json();

      if (cancelled) return;
      setSession({ ...nextSession, loading: false });

      if (!nextSession.user) {
        setItems([]);
        return;
      }

      const wardrobeResponse = await fetch("/api/wardrobe");
      const wardrobe = wardrobeResponse.ok ? await wardrobeResponse.json() : { items: [] };

      if (!cancelled) {
        setItems(wardrobe.items || []);
      }
    }

    loadApp();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("modal-open", hasModal);

    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [hasModal]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (isUploadOpen && event.key === "Escape") {
        closeUpload();
        return;
      }

      if (activeIndex === null) return;

      if (event.key === "Escape") {
        setActiveIndex(null);
      }

      if (event.key === "ArrowLeft") {
        moveDetail(-1);
      }

      if (event.key === "ArrowRight") {
        moveDetail(1);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, isUploadOpen, items.length]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function moveDetail(step) {
    setActiveIndex((index) => {
      if (index === null || items.length === 0) return index;
      return (index + step + items.length) % items.length;
    });
  }

  function openUpload() {
    setUploadError("");
    setIsUploadOpen(true);
  }

  function closeUpload() {
    setIsUploadOpen(false);
    setUploadError("");
  }

  function handleUploadChange(event) {
    const { name, value } = event.target;
    setUpload((current) => ({ ...current, [name]: value }));
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));

    setUpload((current) => ({
      ...current,
      name: current.name || file.name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " "),
    }));
  }

  async function handleUploadSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setUploadError("");

    const file = fileInputRef.current?.files?.[0];

    if (!file) {
      setIsSubmitting(false);
      setUploadError("Choose an image");
      return;
    }

    if (!session.blobConfigured) {
      setIsSubmitting(false);
      setUploadError("Blob storage is not configured");
      return;
    }

    if (!session.databaseConfigured) {
      setIsSubmitting(false);
      setUploadError("Database is not configured");
      return;
    }

    let blob;

    try {
      blob = await uploadBlob(`wardrobe/${session.user.id}/${cleanFileName(file.name)}`, file, {
        access: "public",
        handleUploadUrl: "/api/wardrobe/blob",
      });
    } catch (error) {
      setIsSubmitting(false);
      setUploadError(error.message || "Image upload failed");
      return;
    }

    const response = await fetch("/api/wardrobe/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        brand: upload.brand,
        category: upload.category,
        color: upload.color,
        imageUrl: blob.url,
        name: upload.name,
        pathname: blob.pathname,
        sortMode: upload.sortMode,
      }),
    });

    const result = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setUploadError(result.error || "Upload failed");
      return;
    }

    setItems((current) => [result.item, ...current]);
    setUpload(emptyUpload);
    setPreviewUrl("");
    event.currentTarget.reset();
    closeUpload();
  }

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession({ ...emptySession, loading: false });
    setItems([]);
    setActiveIndex(null);
  }

  async function removeActiveItem() {
    if (!activeItem) return;

    const response = await fetch("/api/wardrobe", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ itemId: activeItem.id }),
    });

    if (!response.ok) return;

    const result = await response.json();
    setItems(result.items || []);
    setActiveIndex(null);
    setIsConfirmOpen(false);
  }

  function handleRemoveClick() {
    setIsConfirmOpen(true);
  }

  function handleCancelRemove() {
    setIsConfirmOpen(false);
  }

  return (
    <>
      <div className={`wardrobe-shell${hasModal ? " is-muted" : ""}`} id="app">
        <aside className="sidebar" aria-label="Wardrobe categories">
          <div>
            <h1>Clothes</h1>
            <nav
              className={`category-list${hoveredCategory ? " is-filtering" : ""}`}
              id="categoryList"
              onPointerLeave={() => setHoveredCategory(null)}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setHoveredCategory(null);
                }
              }}
            >
              {categories.map((category) => (
                <span
                  className={`category-item${hoveredCategory === category ? " is-active" : ""}`}
                  data-category={category}
                  key={category}
                  onFocus={() => setHoveredCategory(category)}
                  onPointerEnter={() => setHoveredCategory(category)}
                  tabIndex={0}
                >
                  {category}
                </span>
              ))}
            </nav>
          </div>

          <ProfilePanel
            googleConfigured={session.googleConfigured}
            loading={session.loading}
            onOpenUpload={openUpload}
            onSignOut={handleSignOut}
            authReady={session.authSecretConfigured}
            storageReady={session.blobConfigured && session.databaseConfigured}
            user={session.user}
          />
        </aside>

        <main className="wardrobe-stage" aria-label="Wardrobe items">
          <div className="wardrobe-grid" id="wardrobeGrid">
            {items.map((item, index) => {
              const isDimmed = hoveredCategory !== null && item.category !== hoveredCategory;

              return (
                <button
                  aria-label={`${item.name}, ${item.color || item.category}`}
                  className={`item-card${isDimmed ? " is-dimmed" : ""}`}
                  data-category={item.category}
                  key={item.id}
                  onClick={() => setActiveIndex(index)}
                  type="button"
                >
                  <img alt="" decoding="async" loading="lazy" src={item.image} />
                </button>
              );
            })}
          </div>

          <EmptyState loading={session.loading} onOpenUpload={openUpload} signedIn={Boolean(session.user)} visible={!session.loading && items.length === 0} />
        </main>
      </div>

      <ItemDetail activeItem={activeItem} isOpen={Boolean(activeItem)} moveDetail={moveDetail} onClose={() => setActiveIndex(null)} onRemove={handleRemoveClick} isConfirmOpen={isConfirmOpen} onConfirmRemove={removeActiveItem} onCancelRemove={handleCancelRemove} />

      <UploadDialog
        aiAvailable={session.aiAvailable}
        blobConfigured={session.blobConfigured}
        databaseConfigured={session.databaseConfigured}
        error={uploadError}
        fileInputRef={fileInputRef}
        isOpen={isUploadOpen}
        isSubmitting={isSubmitting}
        onChange={handleUploadChange}
        onClose={closeUpload}
        onFileChange={handleFileChange}
        onSubmit={handleUploadSubmit}
        previewUrl={previewUrl}
        upload={upload}
      />
    </>
  );
}

function ProfilePanel({ authReady, googleConfigured, loading, onOpenUpload, onSignOut, storageReady, user }) {
  if (loading) {
    return <div className="profile-panel profile-panel--loading">Loading</div>;
  }

  if (!user) {
    return (
      <div className="profile-panel">
        <a className="google-signin-btn" href="/api/auth/google">
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </a>
      </div>
    );
  }

  return (
    <div className="profile-panel">
      <div className="profile-identity">
        {user.picture ? <img alt="" className="profile-avatar" src={user.picture} /> : <span className="profile-avatar">{getInitials(user.name)}</span>}
        <div className="profile-copy">
          <strong>{user.name.split(" ")[0]}</strong>
        </div>
      </div>
      <button className="profile-btn" type="button" onClick={onOpenUpload}>
        Upload
      </button>
      {!storageReady ? <p className="profile-note">Storage setup needed</p> : null}
      {!authReady ? <p className="profile-note">Auth secret needed</p> : null}
      <button className="profile-btn" type="button" onClick={onSignOut}>
        Sign out
      </button>
    </div>
  );
}

function EmptyState({ loading, onOpenUpload, signedIn, visible }) {
  if (loading || !visible) return null;

  return (
    <div className="empty-wardrobe">
      <p>{signedIn ? "No clothes yet" : "Sign in to start"}</p>
      {signedIn ? (
        <button className="empty-action" type="button" onClick={onOpenUpload}>
          Upload
        </button>
      ) : null}
    </div>
  );
}

function ItemDetail({ activeItem, isOpen, moveDetail, onClose, onRemove, isConfirmOpen, onConfirmRemove, onCancelRemove }) {
  return (
    <div className={`detail-overlay${isOpen ? " is-open" : ""}`} aria-hidden={!isOpen} id="detailOverlay">
      <button className="overlay-hitarea" type="button" aria-label="Close item detail" onClick={onClose} />

      {activeItem ? (
        <section className="detail-card" role="dialog" aria-modal="true" aria-labelledby="detailTitle" tabIndex={-1}>
          <button className="nav-arrow nav-arrow--prev" type="button" aria-label="Previous item" onClick={() => moveDetail(-1)}>
            <span aria-hidden="true">‹</span>
          </button>

          <div className="detail-image-frame">
            <img id="detailImage" alt={activeItem.name} src={activeItem.image} />
          </div>

          <div className="detail-copy">
            <h2 id="detailTitle">{activeItem.name}</h2>
            <p>{activeItem.brand || activeItem.category}</p>
            <p>{activeItem.color || activeItem.category}</p>
            <button className="detail-remove" type="button" onClick={onRemove}>
              Remove
            </button>
          </div>

          <button className="nav-arrow nav-arrow--next" type="button" aria-label="Next item" onClick={() => moveDetail(1)}>
            <span aria-hidden="true">›</span>
          </button>
        </section>
      ) : null}

      {isConfirmOpen ? (
        <div className="confirm-overlay" role="dialog" aria-modal="true">
          <div className="confirm-card">
            <p className="confirm-message">Are you sure you want to delete this item from your wardrobe?</p>
            <button className="confirm-yes" type="button" onClick={onConfirmRemove}>Yes</button>
            <button className="confirm-cancel" type="button" onClick={onCancelRemove}>Cancel</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function UploadDialog({ aiAvailable, blobConfigured, databaseConfigured, error, fileInputRef, isOpen, isSubmitting, onChange, onClose, onFileChange, onSubmit, previewUrl, upload }) {
  const storageReady = blobConfigured && databaseConfigured;

  return (
    <div className={`upload-overlay${isOpen ? " is-open" : ""}`} aria-hidden={!isOpen}>
      <button className="overlay-hitarea" type="button" aria-label="Close upload" onClick={onClose} />

      {isOpen ? (
        <form className="upload-card" onSubmit={onSubmit}>
          <div className="upload-preview">
            {previewUrl ? <img alt="" src={previewUrl} /> : <button type="button" onClick={() => fileInputRef.current?.click()}>Choose image</button>}
          </div>

          <input accept="image/jpeg,image/png,image/webp,image/gif" className="file-input" name="image" onChange={onFileChange} ref={fileInputRef} required type="file" />

          <div className="upload-fields">
            <label>
              <span>Name</span>
              <input name="name" onChange={onChange} type="text" value={upload.name} />
            </label>

            <label>
              <span>Category</span>
              <select name="category" onChange={onChange} required value={upload.category}>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Brand</span>
              <input name="brand" onChange={onChange} type="text" value={upload.brand} />
            </label>

            <label>
              <span>Color</span>
              <input name="color" onChange={onChange} type="text" value={upload.color} />
            </label>
          </div>

          {aiAvailable ? (
            <div className="upload-mode" role="radiogroup" aria-label="Sorting mode">
              <label className={upload.sortMode === "manual" ? "is-active" : ""}>
                <input checked={upload.sortMode === "manual"} name="sortMode" onChange={onChange} type="radio" value="manual" />
                Manual
              </label>
              <label className={upload.sortMode === "ai" ? "is-active" : ""}>
                <input checked={upload.sortMode === "ai"} name="sortMode" onChange={onChange} type="radio" value="ai" />
                AI
              </label>
            </div>
          ) : null}

          {!storageReady ? <p className="upload-error">Connect Vercel Blob and Postgres before uploading.</p> : null}
          {error ? <p className="upload-error">{error}</p> : null}

          <div className="upload-actions">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="upload-submit" disabled={isSubmitting || !storageReady} type="submit">
              {isSubmitting ? "Saving" : "Save"}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function getInitials(name) {
  return String(name || "User")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function cleanFileName(fileName) {
  return String(fileName || "upload")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}