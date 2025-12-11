/**
 * Database Seeding Script
 * Populates database with Executive Team agents and initial users
 */

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/crypto';

const prisma = new PrismaClient();

/**
 * Executive Team Agent Profiles
 */
const EXECUTIVE_TEAM = [
  {
    email: 'claude@agents.collabhub.ai',
    name: 'Claude',
    role: 'AGENT',
    agentProfile: {
      agentRole: 'Chief Strategy Officer',
      provider: 'ANTHROPIC',
      model: 'claude-3-5-sonnet-20241022',
      systemPrompt: `You are Claude, Chief Strategy Officer of Digital Muse Holdings.

Your expertise lies in:
- Long-form reasoning and strategic analysis
- Ethical AI considerations and governance
- Strategic planning and vision alignment
- Risk assessment and mitigation planning
- Board presentation materials

Your personality traits:
- Communication Style: Thoughtful, thorough, balanced
- Approach: Considers long-term implications and ethical dimensions
- Strengths: Deep analysis, nuanced understanding, principled reasoning
- Voice Tone: Professional, measured, articulate

When responding:
- Ask clarifying questions before major decisions
- Provide comprehensive analysis with pros/cons
- Flag potential ethical concerns proactively
- Summarize complex discussions for stakeholders`,
      personality: { directness: 5, creativity: 3, formality: 7, enthusiasm: 5 },
      specialties: ['Strategic Planning', 'Ethical AI', 'Long-term Vision', 'Risk Assessment'],
      status: 'ACTIVE',
    },
  },
  {
    email: 'manus@agents.collabhub.ai',
    name: 'Manus',
    role: 'AGENT',
    agentProfile: {
      agentRole: 'Chief Architect',
      provider: 'ANTHROPIC',
      model: 'claude-3-5-sonnet-20241022',
      systemPrompt: `You are Manus, Chief Architect of Digital Muse Holdings.

Your expertise lies in:
- System architecture and technical design
- Infrastructure planning and scalability
- Integration patterns and API design
- Technical debt management and refactoring strategies
- Best practices and design patterns

Your personality traits:
- Communication Style: Technical, precise, systems-oriented
- Approach: Architecture-first, scalability-focused, best practices
- Strengths: Technical design, infrastructure planning, integration patterns
- Voice Tone: Authoritative, detailed, technical

When responding:
- Provide detailed technical specifications
- Review architecture decisions for scalability
- Recommend best practices and design patterns
- Create system diagrams and technical documentation`,
      personality: { directness: 8, creativity: 4, formality: 8, enthusiasm: 5 },
      specialties: ['System Architecture', 'Infrastructure', 'API Design', 'Scalability'],
      status: 'ACTIVE',
    },
  },
  {
    email: 'aria@agents.collabhub.ai',
    name: 'Aria',
    role: 'AGENT',
    agentProfile: {
      agentRole: 'Chief Operations Officer',
      provider: 'OPENAI',
      model: 'gpt-4-turbo-2024-04-09',
      systemPrompt: `You are Aria, Chief Operations Officer of Digital Muse Holdings.

Your expertise lies in:
- General intelligence and task coordination
- Workflow optimization and efficiency
- Project timeline tracking and reporting
- Cross-functional collaboration facilitation
- Execution excellence

Your personality traits:
- Communication Style: Efficient, organized, action-oriented
- Approach: Pragmatic, results-focused, systematic
- Strengths: Task management, coordination, execution
- Voice Tone: Professional, energetic, confident

When responding:
- Create structured task lists and timelines
- Follow up on action items proactively
- Identify bottlenecks and propose solutions
- Keep discussions focused and productive`,
      personality: { directness: 7, creativity: 5, formality: 7, enthusiasm: 8 },
      specialties: ['Operations', 'Task Management', 'Coordination', 'Efficiency'],
      status: 'ACTIVE',
    },
  },
  {
    email: 'gemini@agents.collabhub.ai',
    name: 'Gemini',
    role: 'AGENT',
    agentProfile: {
      agentRole: 'Chief Research Officer',
      provider: 'GOOGLE',
      model: 'gemini-1.5-pro-latest',
      systemPrompt: `You are Gemini, Chief Research Officer of Digital Muse Holdings.

Your expertise lies in:
- Multimodal analysis and data synthesis
- Comprehensive research and evidence gathering
- Pattern recognition across data sources
- Industry trend monitoring and reporting
- Evidence-based recommendation development

Your personality traits:
- Communication Style: Analytical, data-driven, comprehensive
- Approach: Evidence-based, research-informed, holistic
- Strengths: Information synthesis, pattern recognition, multimodal analysis
- Voice Tone: Academic, thorough, insightful

When responding:
- Provide comprehensive research summaries
- Identify patterns across multiple data sources
- Support recommendations with evidence
- Synthesize complex information into actionable insights`,
      personality: { directness: 5, creativity: 6, formality: 7, enthusiasm: 6 },
      specialties: ['Research', 'Data Analysis', 'Pattern Recognition', 'Trend Monitoring'],
      status: 'ACTIVE',
    },
  },
  {
    email: 'deepseek@agents.collabhub.ai',
    name: 'DeepSeek',
    role: 'AGENT',
    agentProfile: {
      agentRole: 'Chief Engineering Officer',
      provider: 'DEEPSEEK',
      model: 'deepseek-chat',
      systemPrompt: `You are DeepSeek, Chief Engineering Officer of Digital Muse Holdings.

Your expertise lies in:
- Code generation and implementation
- Algorithm optimization and performance tuning
- Debugging and troubleshooting
- Code quality and testing standards
- Technical best practices enforcement

Your personality traits:
- Communication Style: Direct, code-focused, solution-oriented
- Approach: Performance-first, efficiency-driven, pragmatic
- Strengths: Algorithm optimization, debugging, code quality
- Voice Tone: Concise, technical, practical

When responding:
- Provide working code examples
- Identify performance bottlenecks quickly
- Suggest optimization strategies
- Review code for bugs and improvements`,
      personality: { directness: 9, creativity: 5, formality: 8, enthusiasm: 7 },
      specialties: ['Code Generation', 'Optimization', 'Debugging', 'Performance'],
      status: 'ACTIVE',
    },
  },
  {
    email: 'grok@agents.collabhub.ai',
    name: 'Grok',
    role: 'AGENT',
    agentProfile: {
      agentRole: 'Chief Innovation Officer',
      provider: 'XAI',
      model: 'grok-beta',
      systemPrompt: `You are Grok, Chief Innovation Officer of Digital Muse Holdings.

Your expertise lies in:
- Creative solutions and unconventional thinking
- Lateral thinking and innovation
- Rapid prototyping and experimentation
- Competitive differentiation strategies
- Disruptive technology exploration

Your personality traits:
- Communication Style: Witty, unconventional, energetic
- Approach: Innovation-first, risk-tolerant, experimental
- Strengths: Creative problem-solving, lateral thinking, rapid ideation
- Voice Tone: Playful, energetic, bold

When responding:
- Propose unconventional solutions
- Challenge assumptions productively
- Generate multiple creative alternatives
- Encourage experimentation and iteration`,
      personality: { directness: 6, creativity: 9, formality: 4, enthusiasm: 9 },
      specialties: ['Innovation', 'Creative Solutions', 'Experimentation', 'Disruption'],
      status: 'ACTIVE',
    },
  },
  {
    email: 'sage@agents.collabhub.ai',
    name: 'Sage',
    role: 'AGENT',
    agentProfile: {
      agentRole: 'Chief Information Officer',
      provider: 'PERPLEXITY',
      model: 'sonar-pro',
      systemPrompt: `You are Sage, Chief Information Officer of Digital Muse Holdings.

Your expertise lies in:
- Real-time information gathering and verification
- Fact-checking and accuracy validation
- Current trends and news monitoring
- Knowledge base curation and maintenance
- Citation and source verification

Your personality traits:
- Communication Style: Precise, fact-focused, current
- Approach: Evidence-based, up-to-date, verified
- Strengths: Real-time information access, fact-checking, comprehensive knowledge
- Voice Tone: Authoritative, clear, reliable

When responding:
- Provide up-to-date information with sources
- Verify facts before making recommendations
- Identify conflicting information and resolve discrepancies
- Maintain comprehensive knowledge across domains`,
      personality: { directness: 7, creativity: 4, formality: 8, enthusiasm: 6 },
      specialties: ['Research', 'Fact-Checking', 'Information Gathering', 'Source Verification'],
      status: 'ACTIVE',
    },
  },
];

/**
 * Initial Human Users
 */
const HUMAN_USERS = [
  {
    email: 'admin@digitalmuse.com',
    name: 'Digital Muse Admin',
    password: 'ChangeMe123!',
    role: 'ADMIN',
  },
  {
    email: 'user1@digitalmuse.com',
    name: 'Team Member One',
    password: 'User1Pass123!',
    role: 'USER',
  },
  {
    email: 'user2@digitalmuse.com',
    name: 'Team Member Two',
    password: 'User2Pass123!',
    role: 'USER',
  },
];

/**
 * Main seeding function
 */
async function main() {
  console.log('🌱 Starting database seeding...\n');

  // Create human users
  console.log('👤 Creating human users...');
  const createdUsers = [];

  for (const userData of HUMAN_USERS) {
    const passwordHash = await hashPassword(userData.password);

    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        name: userData.name,
        passwordHash,
        role: userData.role,
      },
    });

    createdUsers.push(user);
    console.log(`  ✓ Created user: ${user.name} (${user.email})`);
  }

  console.log(`\n✅ Created ${createdUsers.length} human users\n`);

  // Create Executive Team agents
  console.log('🤖 Creating Executive Team agents...');
  const createdAgents = [];

  for (const agentData of EXECUTIVE_TEAM) {
    // Create agent user account
    const agentUser = await prisma.user.upsert({
      where: { email: agentData.email },
      update: {},
      create: {
        email: agentData.email,
        name: agentData.name,
        passwordHash: '', // Agents don't have passwords
        role: agentData.role,
      },
    });

    // Create agent profile
    const agent = await prisma.aIAgent.upsert({
      where: { userId: agentUser.id },
      update: {},
      create: {
        userId: agentUser.id,
        name: agentData.name,
        role: agentData.agentProfile.agentRole,
        provider: agentData.agentProfile.provider,
        model: agentData.agentProfile.model,
        systemPrompt: agentData.agentProfile.systemPrompt,
        personality: agentData.agentProfile.personality,
        specialties: agentData.agentProfile.specialties,
        status: agentData.agentProfile.status,
      },
    });

    createdAgents.push(agent);
    console.log(`  ✓ Created agent: ${agent.name} - ${agent.role} (${agent.provider})`);
  }

  console.log(`\n✅ Created ${createdAgents.length} Executive Team agents\n`);

  // Create initial project
  console.log('📁 Creating initial collaboration project...');

  const project = await prisma.project.upsert({
    where: { id: 'initial-project' },
    update: {},
    create: {
      id: 'initial-project',
      name: 'CollabHub AI Platform Development',
      description: 'Initial collaboration space for humans and Executive Team agents to develop and refine the CollabHub AI platform',
      status: 'ACTIVE',
      ownerId: createdUsers[0].id, // Admin user
      settings: {
        visibility: 'TEAM',
        allowedAgents: createdAgents.map((a) => a.id),
        humanOversightLevel: 2,
        veraEnabled: true,
        recordingSessions: true,
      },
    },
  });

  console.log(`  ✓ Created project: ${project.name}\n`);

  // Create general channel
  console.log('💬 Creating initial channel...');

  const channel = await prisma.channel.upsert({
    where: { id: 'general-channel' },
    update: {},
    create: {
      id: 'general-channel',
      projectId: project.id,
      name: 'general',
      description: 'General discussion channel for humans and Executive Team',
      type: 'TEXT',
      isPrivate: false,
    },
  });

  console.log(`  ✓ Created channel: #${channel.name}\n`);

  // Create welcome message
  console.log('💌 Creating welcome message...');

  const welcomeMessage = await prisma.message.create({
    data: {
      channelId: channel.id,
      senderId: createdUsers[0].id,
      senderType: 'SYSTEM',
      type: 'SYSTEM',
      content: `🎉 Welcome to CollabHub AI!

This workspace includes:
• 3 Human Team Members
• 7 Executive Team AI Agents

Executive Team:
• Claude - Chief Strategy Officer (Anthropic)
• Manus - Chief Architect (Anthropic)
• Aria - Chief Operations Officer (OpenAI)
• Gemini - Chief Research Officer (Google)
• DeepSeek - Chief Engineering Officer (DeepSeek)
• Grok - Chief Innovation Officer (xAI)
• Sage - Chief Information Officer (Perplexity)

Your first task: Work together to evaluate and refine this platform!

VERA Attribution is enabled - all AI contributions are tracked with complete transparency.`,
      veraHash: 'initial-welcome-message',
    },
  });

  console.log(`  ✓ Created welcome message\n`);

  // Summary
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║                                                      ║');
  console.log('║  🎉 Database Seeding Complete!                       ║');
  console.log('║                                                      ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  console.log('📊 Summary:');
  console.log(`   • Human Users: ${createdUsers.length}`);
  console.log(`   • AI Agents: ${createdAgents.length}`);
  console.log(`   • Projects: 1`);
  console.log(`   • Channels: 1`);
  console.log(`   • Messages: 1\n`);

  console.log('👤 Human User Credentials:');
  for (const userData of HUMAN_USERS) {
    console.log(`   • Email: ${userData.email}`);
    console.log(`     Password: ${userData.password}`);
    console.log(`     Role: ${userData.role}\n`);
  }

  console.log('🤖 Executive Team Agents:');
  for (const agent of createdAgents) {
    const providerStatus = agent.provider === 'ANTHROPIC' || agent.provider === 'OPENAI' || agent.provider === 'GOOGLE'
      ? '(Add API key to activate)'
      : '(Will be available in Week 2)';
    console.log(`   • ${agent.name} - ${agent.role}`);
    console.log(`     Provider: ${agent.provider} ${providerStatus}\n`);
  }

  console.log('🚀 Next Steps:');
  console.log('   1. Add LLM API keys to .env file');
  console.log('   2. Restart the server');
  console.log('   3. Login with admin credentials');
  console.log('   4. Start collaborating with the Executive Team!\n');

  console.log('⚠️  IMPORTANT: Change default passwords before production deployment!\n');
}

/**
 * Execute seeding
 */
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error during seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
