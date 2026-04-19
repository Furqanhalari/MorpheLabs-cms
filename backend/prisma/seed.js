const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Super Admin
  const password = await bcrypt.hash('Admin@1234', 12);
  const admin = await prisma.user.upsert({
    where:  { email: 'admin@morphelabs.org' },
    update: {},
    create: { email: 'admin@morphelabs.org', password, firstName: 'Super', lastName: 'Admin', role: 'SUPER_ADMIN' },
  });
  console.log('✅ Super Admin created:', admin.email);

  // Sample users
  const pass2 = await bcrypt.hash('Editor@1234', 12);
  await prisma.user.upsert({
    where:  { email: 'editor@morphelabs.org' },
    update: {},
    create: { email: 'editor@morphelabs.org', password: pass2, firstName: 'Blog', lastName: 'Editor', role: 'BLOG_EDITOR' },
  });
  const pass3 = await bcrypt.hash('Hr@1234567', 12);
  await prisma.user.upsert({
    where:  { email: 'hr@morphelabs.org' },
    update: {},
    create: { email: 'hr@morphelabs.org', password: pass3, firstName: 'HR', lastName: 'Manager', role: 'HR_MANAGER' },
  });

  // Blog categories
  const cats = ['AI Automation', 'Voice Agents', 'Web Development', 'Case Studies', 'Company News'];
  for (const name of cats) {
    await prisma.category.upsert({
      where:  { slug: name.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: { name, slug: name.toLowerCase().replace(/\s+/g, '-') },
    });
  }
  console.log('✅ Blog categories seeded');

  // Sample blog post
  await prisma.post.upsert({
    where:  { slug: 'welcome-to-morphelabs-blog' },
    update: {},
    create: {
      title: 'Welcome to the MorpheLabs Blog',
      slug:  'welcome-to-morphelabs-blog',
      excerpt: 'Discover how MorpheLabs is transforming businesses with AI automation.',
      content: '<p>Welcome to the MorpheLabs blog! We share insights on AI automation, voice agents, and intelligent workflows.</p>',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      readingTime: 1,
      authorId: admin.id,
      isFeatured: true,
    },
  });

  // Sample service
  await prisma.service.upsert({
    where:  { slug: 'ai-chatbots' },
    update: {},
    create: {
      title: 'AI Chatbots',
      slug:  'ai-chatbots',
      description: 'Smart chatbots that engage customers and automate conversations 24/7.',
      content: '<p>Our AI chatbots are built to handle customer interactions intelligently at scale.</p>',
      isPublished: true,
      sortOrder: 1,
      features: ['24/7 availability', 'Multi-language', 'CRM integration', 'Analytics dashboard'],
    },
  });

  // Sample job listing
  await prisma.jobListing.upsert({
    where:  { slug: 'senior-ai-engineer' },
    update: {},
    create: {
      title: 'Senior AI Engineer',
      slug:  'senior-ai-engineer',
      department: 'Engineering',
      location: 'Remote',
      locationType: 'REMOTE',
      employmentType: 'FULL_TIME',
      description: '<p>Join MorpheLabs to build next-generation AI automation solutions.</p>',
      requirements: '<ul><li>3+ years Python experience</li><li>LLM/LangChain experience</li></ul>',
      responsibilities: '<ul><li>Build AI agents</li><li>Design automation workflows</li></ul>',
      benefits: '<ul><li>Competitive salary</li><li>Remote-first</li><li>Learning budget</li></ul>',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Sample content seeded');
  console.log('\n🎉 Seed complete!');
  console.log('   Admin:  admin@morphelabs.org  /  Admin@1234');
  console.log('   Editor: editor@morphelabs.org /  Editor@1234');
  console.log('   HR:     hr@morphelabs.org     /  Hr@1234567\n');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
