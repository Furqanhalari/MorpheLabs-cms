import { getAllPostSlugs, getPostBySlug } from '../../lib/cms';
import Head from 'next/head';
import { useRouter } from 'next/router';

export async function getStaticPaths() {
  const slugs = await getAllPostSlugs();
  return {
    paths: slugs.map(slug => ({ params: { slug } })),
    fallback: 'blocking', // SSR on first request, then cached
  };
}

export async function getStaticProps({ params }) {
  const post = await getPostBySlug(params.slug);
  if (!post) return { notFound: true };
  return { props: { post }, revalidate: 60 };
}

export default function BlogPost({ post }) {
  const router = useRouter();
  if (router.isFallback) return <div style={{ padding: 60, textAlign: 'center' }}>Loading...</div>;

  return (
    <>
      <Head>
        <title>{post.metaTitle || post.title} — MorpheLabs</title>
        <meta name="description" content={post.metaDescription || post.excerpt} />
        {post.ogImage && <meta property="og:image" content={post.ogImage} />}
        <meta property="og:title" content={post.metaTitle || post.title} />
        <meta property="og:type" content="article" />
      </Head>

      <article style={{ maxWidth: 780, margin: '0 auto', padding: '60px 24px' }}>
        {/* Breadcrumb */}
        <nav style={{ marginBottom: 24, fontSize: 14, color: '#999' }}>
          <a href="/" style={{ color: '#00B4D8', textDecoration: 'none' }}>Home</a>
          {' / '}
          <a href="/blog" style={{ color: '#00B4D8', textDecoration: 'none' }}>Blog</a>
          {' / '}
          <span>{post.title}</span>
        </nav>

        {/* Categories */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {post.categories?.map(c => (
            <span key={c.category.id} style={{ padding: '3px 12px', borderRadius: 100,
              background: '#e8f7fb', color: '#00B4D8', fontSize: 13, fontWeight: 600 }}>
              {c.category.name}
            </span>
          ))}
        </div>

        <h1 style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.2, marginBottom: 20 }}>{post.title}</h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32,
          paddingBottom: 24, borderBottom: '1px solid #eee', color: '#666', fontSize: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#00B4D8',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
            {post.author?.firstName?.[0]}{post.author?.lastName?.[0]}
          </div>
          <span style={{ fontWeight: 600, color: '#333' }}>
            {post.author?.firstName} {post.author?.lastName}
          </span>
          <span>·</span>
          <span>{post.readingTime} min read</span>
          {post.publishedAt && (
            <>
              <span>·</span>
              <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}</span>
            </>
          )}
        </div>

        {post.featuredImage && (
          <img src={post.featuredImage} alt={post.title}
            style={{ width: '100%', borderRadius: 12, marginBottom: 36, maxHeight: 460, objectFit: 'cover' }} />
        )}

        {/* Rich text content */}
        <div
          className="post-content"
          dangerouslySetInnerHTML={{ __html: post.content }}
          style={{ fontSize: 17, lineHeight: 1.8, color: '#2d2d2d' }}
        />

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid #eee' }}>
            <span style={{ fontWeight: 600, marginRight: 12 }}>Tags:</span>
            {post.tags.map(t => (
              <span key={t.tag.id} style={{ marginRight: 8, padding: '3px 10px',
                background: '#f5f5f5', borderRadius: 4, fontSize: 13 }}>{t.tag.name}</span>
            ))}
          </div>
        )}
      </article>

      <style>{`
        .post-content h2 { font-size: 28px; font-weight: 700; margin: 36px 0 16px; }
        .post-content h3 { font-size: 22px; font-weight: 700; margin: 28px 0 12px; }
        .post-content p  { margin-bottom: 20px; }
        .post-content ul, .post-content ol { padding-left: 28px; margin-bottom: 20px; }
        .post-content li { margin-bottom: 8px; }
        .post-content blockquote { border-left: 4px solid #00B4D8; padding: 12px 20px; margin: 24px 0; background: #f0f9fb; border-radius: 0 8px 8px 0; }
        .post-content pre { background: #1a1a2e; color: #e8edf5; padding: 20px; border-radius: 8px; overflow-x: auto; margin: 24px 0; }
        .post-content code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 14px; }
        .post-content img { max-width: 100%; border-radius: 8px; margin: 20px 0; }
      `}</style>
    </>
  );
}
