// pages/blog/index.jsx — Blog listing page with ISR
import { getPublishedPosts, getCategories } from '../../lib/cms';
import Link from 'next/link';
import Head from 'next/head';

export async function getStaticProps() {
  const [postsData, categories] = await Promise.all([
    getPublishedPosts({ limit: 12 }),
    getCategories(),
  ]);
  return {
    props: { posts: postsData.data || [], categories: categories || [] },
    revalidate: 60, // ISR: rebuild every 60 seconds on demand
  };
}

export default function BlogIndex({ posts, categories }) {
  return (
    <>
      <Head>
        <title>Blog — MorpheLabs</title>
        <meta name="description" content="Insights on AI automation, voice agents, and intelligent workflows." />
      </Head>
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 24px' }}>
        <h1 style={{ fontSize: 48, fontWeight: 800, marginBottom: 8 }}>Blog</h1>
        <p style={{ color: '#666', marginBottom: 40, fontSize: 18 }}>
          Insights on AI automation, voice agents, and the future of work.
        </p>

        {/* Category filters */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 40 }}>
          {categories.map(cat => (
            <Link key={cat.id} href={`/blog?category=${cat.slug}`}
              style={{ padding: '6px 16px', borderRadius: 100, background: '#f0f0f0',
                color: '#333', textDecoration: 'none', fontSize: 14 }}>
              {cat.name}
            </Link>
          ))}
        </div>

        {/* Post grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 28 }}>
          {posts.map(post => (
            <Link key={post.id} href={`/blog/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <article style={{ background: '#fff', borderRadius: 12, overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: 'transform 0.2s',
                cursor: 'pointer' }}>
                {post.featuredImage && (
                  <img src={post.featuredImage} alt={post.title}
                    style={{ width: '100%', height: 200, objectFit: 'cover' }} />
                )}
                <div style={{ padding: 24 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                    {post.categories?.slice(0,2).map(c => (
                      <span key={c.category.id} style={{ padding: '2px 10px', borderRadius: 100,
                        background: '#e8f7fb', color: '#00B4D8', fontSize: 12, fontWeight: 600 }}>
                        {c.category.name}
                      </span>
                    ))}
                  </div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10, lineHeight: 1.3 }}>{post.title}</h2>
                  <p style={{ color: '#666', fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>{post.excerpt}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: '#999' }}>
                    <span>{post.author?.firstName} {post.author?.lastName}</span>
                    <span>·</span>
                    <span>{post.readingTime} min read</span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {posts.length === 0 && (
          <p style={{ color: '#999', textAlign: 'center', padding: '60px 0' }}>No posts yet.</p>
        )}
      </main>
    </>
  );
}
