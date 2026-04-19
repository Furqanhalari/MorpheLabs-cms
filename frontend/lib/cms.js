const CMS_API = process.env.CMS_API_URL || 'http://localhost:4000/api/v1';

async function fetchCMS(path, options = {}) {
  const res = await fetch(`${CMS_API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`CMS API error: ${res.status} ${path}`);
  return res.json();
}

// ── Blog ──────────────────────────────────────────────────────────────────────
export async function getPublishedPosts({ page = 1, category, limit = 12 } = {}) {
  const params = new URLSearchParams({ status: 'PUBLISHED', page, limit });
  if (category) params.set('category', category);
  return fetchCMS(`/blog?${params}`, { next: { revalidate: 60 } });
}

export async function getPostBySlug(slug) {
  // Find by slug via search
  const data = await fetchCMS(`/blog?search=${slug}&status=PUBLISHED&limit=1`, { next: { revalidate: 60 } });
  return data?.data?.[0] || null;
}

export async function getFeaturedPosts() {
  return fetchCMS('/blog?status=PUBLISHED&featured=true&limit=3', { next: { revalidate: 120 } });
}

export async function getAllPostSlugs() {
  const data = await fetchCMS('/blog?status=PUBLISHED&limit=1000');
  return data?.data?.map(p => p.slug) || [];
}

export async function getCategories() {
  return fetchCMS('/blog/categories/all', { next: { revalidate: 300 } });
}

// ── Services ──────────────────────────────────────────────────────────────────
export async function getPublishedServices() {
  return fetchCMS('/services?published=true', { next: { revalidate: 300 } });
}

export async function getPublishedPortfolio(serviceId) {
  const params = serviceId ? `?published=true&service=${serviceId}` : '?published=true';
  return fetchCMS(`/services/portfolio/all${params}`, { next: { revalidate: 300 } });
}

// ── Careers ───────────────────────────────────────────────────────────────────
export async function getActiveJobs() {
  return fetchCMS('/careers?status=ACTIVE', { next: { revalidate: 60 } });
}

export async function getJobBySlug(slug) {
  const data = await fetchCMS(`/careers?search=${slug}&status=ACTIVE&limit=1`, { next: { revalidate: 60 } });
  return data?.data?.[0] || null;
}

export async function getAllJobSlugs() {
  const data = await fetchCMS('/careers?status=ACTIVE&limit=1000');
  return data?.data?.map(j => j.slug) || [];
}

// ── Application submission (client-side POST) ─────────────────────────────────
export async function submitJobApplication(jobId, formData) {
  const res = await fetch(`${CMS_API}/careers/${jobId}/applications`, {
    method: 'POST',
    body: formData, // FormData with resume file
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Submission failed');
  }
  return res.json();
}
