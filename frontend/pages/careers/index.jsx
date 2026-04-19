import { getActiveJobs } from '../../lib/cms';
import Head from 'next/head';
import Link from 'next/link';

export async function getStaticProps() {
  const data = await getActiveJobs();
  return { props: { jobs: data?.data || [] }, revalidate: 60 };
}

const TYPE_LABEL = { FULL_TIME: 'Full-time', PART_TIME: 'Part-time', CONTRACT: 'Contract', INTERNSHIP: 'Internship', FREELANCE: 'Freelance' };
const LOC_LABEL  = { REMOTE: '🌍 Remote', ONSITE: '🏢 On-site', HYBRID: '🔀 Hybrid' };

export default function CareersPage({ jobs }) {
  const departments = [...new Set(jobs.map(j => j.department))];

  return (
    <>
      <Head>
        <title>Careers — MorpheLabs</title>
        <meta name="description" content="Join MorpheLabs and help build the future of AI automation." />
      </Head>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '60px 24px' }}>
        <h1 style={{ fontSize: 48, fontWeight: 800, marginBottom: 12 }}>Join Our Team</h1>
        <p style={{ fontSize: 18, color: '#666', marginBottom: 48, maxWidth: 600 }}>
          Help us build the future of AI automation. We're a remote-first team obsessed with creating
          intelligent systems that actually work.
        </p>

        {jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#999' }}>
            <p style={{ fontSize: 20 }}>No open positions right now.</p>
            <p>Check back soon or send your CV to <a href="mailto:hr@morphelabs.org" style={{ color: '#00B4D8' }}>hr@morphelabs.org</a></p>
          </div>
        ) : (
          departments.map(dept => (
            <section key={dept} style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#00B4D8', marginBottom: 16,
                paddingBottom: 8, borderBottom: '2px solid #e8f7fb' }}>{dept}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {jobs.filter(j => j.department === dept).map(job => (
                  <Link key={job.id} href={`/careers/${job.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12,
                      padding: '24px 28px', cursor: 'pointer', transition: 'box-shadow 0.2s',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                      <div>
                        <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{job.title}</h3>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          <span style={{ padding: '3px 12px', borderRadius: 100, background: '#f0f0f0',
                            fontSize: 13, color: '#555' }}>{TYPE_LABEL[job.employmentType]}</span>
                          <span style={{ padding: '3px 12px', borderRadius: 100, background: '#f0f9fb',
                            fontSize: 13, color: '#00B4D8' }}>{LOC_LABEL[job.locationType]}</span>
                          {job.location && (
                            <span style={{ padding: '3px 12px', borderRadius: 100, background: '#f5f5f5',
                              fontSize: 13, color: '#666' }}>📍 {job.location}</span>
                          )}
                        </div>
                      </div>
                      <button style={{ padding: '10px 24px', background: '#00B4D8', color: '#fff',
                        border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 15 }}>
                        Apply Now →
                      </button>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))
        )}
      </main>
    </>
  );
}
