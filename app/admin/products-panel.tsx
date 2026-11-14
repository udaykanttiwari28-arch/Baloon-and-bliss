'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductImage {
  id: string;
  storage_path: string;
  alt_text: string;
  is_primary: boolean;
  display_order: number;
  image_url?: string;
}

interface AddOn {
  id: string;
  name: string;
  description: string | null;
  price_minor: number;
  price_on_request: boolean;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  base_price_minor: number;
  tags: string[];
  included_items: string[];
  highlight_label: string | null;
  display_order: number;
  is_active: boolean;
  product_images: ProductImage[];
  product_add_ons: { add_on_id: string; add_ons: AddOn }[];
}

interface FormState {
  name: string;
  description: string;
  highlight_label: string;
  base_price_minor: string;
  sku: string;
  slug: string;
  display_order: string;
  tags: string;
  included_items: string[];
  add_on_ids: string[];
  is_active: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sgd(minor: number) {
  return `S$${(minor / 100).toFixed(2)}`;
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function toSku(name: string) {
  return `BBSG-${toSlug(name).toUpperCase()}`;
}

function getImageUrl(img: ProductImage): string {
  if (img.image_url) return img.image_url;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  if (!url) return '';
  return `${url}/storage/v1/object/public/product-images/${img.storage_path}`;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 13px', border: '1px solid #decbd5',
  borderRadius: 10, font: 'inherit', fontSize: '.9rem', color: '#24151c',
  background: '#fff', boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '.78rem', fontWeight: 700, color: '#765d68',
  letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 5,
};

// ─── Form Modal ───────────────────────────────────────────────────────────────

function ProductFormModal({
  product,
  allAddOns,
  onClose,
  onSaved,
}: {
  product: Product | null;
  allAddOns: AddOn[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!product;
  const [form, setForm] = useState<FormState>(() => ({
    name: product?.name ?? '',
    description: product?.description ?? '',
    highlight_label: product?.highlight_label ?? '',
    base_price_minor: product ? String(product.base_price_minor / 100) : '',
    sku: product?.sku ?? '',
    slug: product?.slug ?? '',
    display_order: product ? String(product.display_order) : '0',
    tags: product?.tags.join(', ') ?? '',
    included_items: product?.included_items ?? [],
    add_on_ids: product?.product_add_ons.map((pa) => pa.add_on_id) ?? [],
    is_active: product?.is_active ?? true,
  }));
  const [includedInput, setIncludedInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedProduct, setSavedProduct] = useState<{ id: string } | null>(
    product ? { id: product.id } : null,
  );
  const [images, setImages] = useState<ProductImage[]>(product?.product_images ?? []);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function handleNameChange(name: string) {
    set('name', name);
    if (!isEdit) {
      set('slug', toSlug(name));
      set('sku', toSku(name));
    }
  }

  function addIncluded() {
    const v = includedInput.trim();
    if (!v) return;
    set('included_items', [...form.included_items, v]);
    setIncludedInput('');
  }

  function removeIncluded(i: number) {
    set('included_items', form.included_items.filter((_, idx) => idx !== i));
  }

  function toggleAddOn(id: string) {
    set('add_on_ids', form.add_on_ids.includes(id)
      ? form.add_on_ids.filter((x) => x !== id)
      : [...form.add_on_ids, id]);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setSaving(true); setError('');

    const price = parseFloat(form.base_price_minor);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      highlight_label: form.highlight_label.trim() || null,
      base_price_minor: Math.round((isNaN(price) ? 0 : price) * 100),
      sku: form.sku.trim() || toSku(form.name),
      slug: form.slug.trim() || toSlug(form.name),
      display_order: parseInt(form.display_order) || 0,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      included_items: form.included_items,
      add_on_ids: form.add_on_ids,
      is_active: form.is_active,
    };

    try {
      let res: Response;
      if (isEdit && product) {
        res = await fetch(`/api/admin/products/${product.id}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      let json: Record<string, unknown> = {};
      try { json = await res.json() as Record<string, unknown>; } catch { /* ignore */ }
      if (!res.ok) { setError((json.error as string) ?? `Error ${res.status}`); setSaving(false); return; }

      if (!isEdit && json.product) {
        setSavedProduct(json.product as { id: string });
      }
      setSaving(false);
      if (isEdit) { onSaved(); onClose(); }
    } catch (err) {
      setError(String(err));
      setSaving(false);
    }
  }

  async function uploadImages(files: FileList) {
    if (!savedProduct) return;
    setUploading(true);
    const fd = new FormData();
    for (const f of Array.from(files)) fd.append('file', f);

    for (const f of Array.from(files)) {
      const singleFd = new FormData();
      singleFd.append('file', f);
      singleFd.append('is_primary', images.length === 0 ? 'true' : 'false');
      const res = await fetch(`/api/admin/products/${savedProduct.id}/images`, {
        method: 'POST', body: singleFd,
      });
      if (res.ok) {
        const data = await res.json() as { image: ProductImage & { image_url: string } };
        setImages((prev) => [...prev, data.image]);
      }
    }
    setUploading(false);
  }

  async function deleteImage(imageId: string) {
    if (!savedProduct) return;
    const res = await fetch(`/api/admin/products/${savedProduct.id}/images?imageId=${imageId}`, { method: 'DELETE' });
    if (res.ok) setImages((prev) => prev.filter((img) => img.id !== imageId));
  }

  async function setPrimaryImage(imageId: string) {
    if (!savedProduct) return;
    const res = await fetch(`/api/admin/products/${savedProduct.id}/images`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ imageId }),
    });
    if (res.ok) {
      setImages((prev) => prev.map((img) => ({ ...img, is_primary: img.id === imageId })));
    }
  }

  const showImages = isEdit || !!savedProduct;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 16px', overflowY: 'auto',
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 640,
        boxShadow: '0 20px 60px rgba(0,0,0,.2)', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f0e6ec', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#24151c' }}>
            {isEdit ? 'Edit Product' : savedProduct ? '✓ Product saved — add images' : 'New Product'}
          </h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#765d68', lineHeight: 1 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
          {!savedProduct ? (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Basic */}
              <section>
                <p style={{ ...labelStyle, fontSize: '.72rem', color: '#db2777', marginBottom: 12 }}>Basic Information</p>
                <div style={{ display: 'grid', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Name *</label>
                    <input style={inputStyle} value={form.name} onChange={(e) => handleNameChange(e.target.value)} required />
                  </div>
                  <div>
                    <label style={labelStyle}>Description</label>
                    <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={form.description} onChange={(e) => set('description', e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Highlight Label <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(e.g. "Most Popular")</span></label>
                    <input style={inputStyle} value={form.highlight_label} onChange={(e) => set('highlight_label', e.target.value)} placeholder="Leave blank for none" />
                  </div>
                </div>
              </section>

              {/* Pricing */}
              <section>
                <p style={{ ...labelStyle, fontSize: '.72rem', color: '#db2777', marginBottom: 12 }}>Pricing & SKU</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Base Price (SGD)</label>
                    <input type="number" min="0" step="0.01" style={inputStyle} value={form.base_price_minor} onChange={(e) => set('base_price_minor', e.target.value)} placeholder="0.00" />
                  </div>
                  <div>
                    <label style={labelStyle}>SKU</label>
                    <input style={inputStyle} value={form.sku} onChange={(e) => set('sku', e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Slug</label>
                    <input style={inputStyle} value={form.slug} onChange={(e) => set('slug', e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Display Order</label>
                    <input type="number" min="0" style={inputStyle} value={form.display_order} onChange={(e) => set('display_order', e.target.value)} />
                  </div>
                </div>
              </section>

              {/* Tags */}
              <section>
                <p style={{ ...labelStyle, fontSize: '.72rem', color: '#db2777', marginBottom: 8 }}>Tags</p>
                <input style={inputStyle} value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="classic, essential, popular (comma-separated)" />
                {form.tags.trim() && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {form.tags.split(',').map((t) => t.trim()).filter(Boolean).map((tag) => (
                      <span key={tag} style={{ background: '#fce7f3', color: '#db2777', fontSize: '.76rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{tag}</span>
                    ))}
                  </div>
                )}
              </section>

              {/* Included */}
              <section>
                <p style={{ ...labelStyle, fontSize: '.72rem', color: '#db2777', marginBottom: 8 }}>What&apos;s Included</p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <input
                    style={{ ...inputStyle, flex: 1 }}
                    value={includedInput}
                    onChange={(e) => setIncludedInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addIncluded(); } }}
                    placeholder="e.g. 1 custom backdrop"
                  />
                  <button type="button" onClick={addIncluded} style={{ background: '#db2777', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap' }}>Add</button>
                </div>
                {form.included_items.length > 0 && (
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {form.included_items.map((item, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fdf4f8', borderRadius: 8, padding: '8px 12px' }}>
                        <span style={{ flex: 1, fontSize: '.88rem', color: '#24151c' }}>✓ {item}</span>
                        <button type="button" onClick={() => removeIncluded(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#765d68', fontSize: '1rem', lineHeight: 1 }}>×</button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Add-ons */}
              {allAddOns.length > 0 && (
                <section>
                  <p style={{ ...labelStyle, fontSize: '.72rem', color: '#db2777', marginBottom: 8 }}>Optional Add-ons</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {allAddOns.map((ao) => (
                      <label key={ao.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: form.add_on_ids.includes(ao.id) ? '#fce7f3' : '#fdf4f8', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', border: `1px solid ${form.add_on_ids.includes(ao.id) ? '#db2777' : '#f0e6ec'}` }}>
                        <input type="checkbox" checked={form.add_on_ids.includes(ao.id)} onChange={() => toggleAddOn(ao.id)} style={{ accentColor: '#db2777' }} />
                        <span style={{ fontSize: '.82rem', color: '#24151c', flex: 1 }}>{ao.name}</span>
                      </label>
                    ))}
                  </div>
                </section>
              )}

              {/* Status */}
              <section>
                <p style={{ ...labelStyle, fontSize: '.72rem', color: '#db2777', marginBottom: 8 }}>Status</p>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} style={{ accentColor: '#db2777', width: 16, height: 16 }} />
                  <span style={{ fontSize: '.9rem', color: '#24151c' }}>Active (visible to customers)</span>
                </label>
              </section>

              {error && <p style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 10, padding: '10px 14px', margin: 0, fontSize: '.88rem' }}>{error}</p>}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
                <button type="button" onClick={onClose} style={{ background: 'none', border: '1px solid #decbd5', borderRadius: 10, padding: '10px 20px', cursor: 'pointer', color: '#765d68', font: 'inherit' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ background: '#db2777', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', cursor: saving ? 'not-allowed' : 'pointer', font: 'inherit', fontWeight: 700, opacity: saving ? .7 : 1 }}>
                  {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          ) : (
            /* After create — show success + image upload */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#dcfce7', color: '#166534', borderRadius: 10, padding: '12px 16px', fontWeight: 600, fontSize: '.9rem' }}>
                Product &quot;{form.name}&quot; created! Now add some images.
              </div>
              <ImageManager
                productId={savedProduct.id}
                images={images}
                uploading={uploading}
                fileInputRef={fileInputRef}
                onUpload={uploadImages}
                onDelete={deleteImage}
                onSetPrimary={setPrimaryImage}
              />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => { onSaved(); onClose(); }} style={{ background: '#db2777', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', cursor: 'pointer', font: 'inherit', fontWeight: 700 }}>
                  Done
                </button>
              </div>
            </div>
          )}

          {/* Edit mode image manager */}
          {isEdit && showImages && (
            <div style={{ marginTop: 24, borderTop: '1px solid #f0e6ec', paddingTop: 20 }}>
              <p style={{ ...labelStyle, fontSize: '.72rem', color: '#db2777', marginBottom: 12 }}>Images</p>
              <ImageManager
                productId={product!.id}
                images={images}
                uploading={uploading}
                fileInputRef={fileInputRef}
                onUpload={uploadImages}
                onDelete={deleteImage}
                onSetPrimary={setPrimaryImage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Image Manager ────────────────────────────────────────────────────────────

function ImageManager({
  productId: _productId,
  images,
  uploading,
  fileInputRef,
  onUpload,
  onDelete,
  onSetPrimary,
}: {
  productId: string;
  images: ProductImage[];
  uploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onUpload: (files: FileList) => void;
  onDelete: (imageId: string) => void;
  onSetPrimary: (imageId: string) => void;
}) {
  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => { if (e.target.files?.length) onUpload(e.target.files); }}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        style={{ background: 'none', border: '2px dashed #decbd5', borderRadius: 12, padding: '14px 24px', cursor: uploading ? 'not-allowed' : 'pointer', color: '#765d68', font: 'inherit', fontSize: '.88rem', width: '100%', marginBottom: 12 }}
      >
        {uploading ? 'Uploading…' : '+ Upload images'}
      </button>
      {images.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {images.map((img) => (
            <div key={img.id} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: `2px solid ${img.is_primary ? '#db2777' : '#f0e6ec'}` }}>
              <img
                src={getImageUrl(img)}
                alt={img.alt_text}
                style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }}
              />
              <div style={{ padding: '6px 8px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                {img.is_primary
                  ? <span style={{ fontSize: '.68rem', color: '#db2777', fontWeight: 700 }}>Primary</span>
                  : <button type="button" onClick={() => onSetPrimary(img.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.68rem', color: '#765d68', padding: 0 }}>Set primary</button>
                }
                <button type="button" onClick={() => onDelete(img.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '.8rem', lineHeight: 1 }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function ProductsPanel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, aoRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/admin/add-ons'),
      ]);
      const prodData = await prodRes.json() as { products?: Product[] };
      const aoData = await aoRes.json() as { addOns?: AddOn[] };
      setProducts(prodData.products ?? []);
      setAddOns(aoData.addOns ?? []);
    } catch {
      setError('Failed to load products.');
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function toggleActive(product: Product) {
    await fetch(`/api/admin/products/${product.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ is_active: !product.is_active }),
    });
    void load();
  }

  function openCreate() { setEditProduct(null); setModalOpen(true); }
  function openEdit(p: Product) { setEditProduct(p); setModalOpen(true); }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
      <p style={{ color: '#765d68' }}>Loading products…</p>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <p style={{ margin: 0, fontSize: '.78rem', color: '#765d68', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em' }}>
            {products.length} product{products.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          style={{ background: '#db2777', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', cursor: 'pointer', font: 'inherit', fontSize: '.86rem', fontWeight: 700 }}
        >
          + Add Product
        </button>
      </div>

      {error && <p style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: '.88rem' }}>{error}</p>}

      {/* Empty state */}
      {products.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 24px', background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(36,21,28,.07)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📦</div>
          <h3 style={{ margin: '0 0 8px', color: '#24151c' }}>No products yet</h3>
          <p style={{ margin: '0 0 20px', color: '#765d68', fontSize: '.9rem' }}>Add your first product to have it appear in the customer catalogue.</p>
          <button type="button" onClick={openCreate} style={{ background: '#db2777', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', cursor: 'pointer', font: 'inherit', fontWeight: 700 }}>
            Add First Product
          </button>
        </div>
      )}

      {/* Product grid */}
      {products.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
          {products.map((p) => {
            const primaryImg = p.product_images.find((i) => i.is_primary) ?? p.product_images[0];
            const imgUrl = primaryImg ? getImageUrl(primaryImg) : null;

            return (
              <div key={p.id} style={{ background: '#fff', borderRadius: 16, boxShadow: '0 3px 16px rgba(36,21,28,.09)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* Image */}
                <div style={{ height: 200, background: imgUrl ? undefined : 'linear-gradient(135deg, #fce7f3 0%, #ede9fe 100%)', position: 'relative', overflow: 'hidden' }}>
                  {imgUrl ? (
                    <img src={imgUrl} alt={primaryImg!.alt_text} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '2.5rem', color: '#db2777' }}>✦</div>
                  )}
                  {/* Status badge overlay */}
                  <span style={{
                    position: 'absolute', top: 10, right: 10,
                    background: p.is_active ? '#dcfce7' : '#f3f4f6',
                    color: p.is_active ? '#166534' : '#6b7280',
                    fontSize: '.68rem', fontWeight: 700, padding: '3px 9px', borderRadius: 20,
                  }}>
                    {p.is_active ? 'Active' : 'Draft'}
                  </span>
                  {p.highlight_label && (
                    <span style={{ position: 'absolute', top: 10, left: 10, background: '#db2777', color: '#fff', fontSize: '.68rem', fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>
                      ★ {p.highlight_label}
                    </span>
                  )}
                </div>

                {/* Body */}
                <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#24151c', fontWeight: 700 }}>{p.name}</h3>
                  {p.tags.length > 0 && (
                    <p style={{ margin: 0, fontSize: '.72rem', color: '#765d68' }}>{p.tags.join(' · ')}</p>
                  )}
                  <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 700, color: '#db2777' }}>
                    From {sgd(p.base_price_minor)}
                  </p>
                  {p.included_items.length > 0 && (
                    <p style={{ margin: '4px 0 0', fontSize: '.75rem', color: '#765d68', lineHeight: 1.4 }}>
                      {p.included_items.slice(0, 2).join(' · ')}{p.included_items.length > 2 ? ` +${p.included_items.length - 2} more` : ''}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div style={{ padding: '10px 16px 14px', display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    style={{ flex: 1, background: '#fdf4f8', border: '1px solid #decbd5', borderRadius: 9, padding: '8px 0', cursor: 'pointer', font: 'inherit', fontSize: '.82rem', fontWeight: 700, color: '#765d68' }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActive(p)}
                    style={{
                      flex: 1, border: '1px solid', borderRadius: 9, padding: '8px 0', cursor: 'pointer', font: 'inherit', fontSize: '.82rem', fontWeight: 700,
                      background: p.is_active ? '#fef2f2' : '#dcfce7',
                      borderColor: p.is_active ? '#fca5a5' : '#86efac',
                      color: p.is_active ? '#dc2626' : '#166534',
                    }}
                  >
                    {p.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <ProductFormModal
          product={editProduct}
          allAddOns={addOns}
          onClose={() => { setModalOpen(false); setEditProduct(null); }}
          onSaved={() => void load()}
        />
      )}
    </div>
  );
}
