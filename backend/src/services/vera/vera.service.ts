/**
 * VERA Attribution Service
 * Tracks and verifies all AI contributions with immutable hashing
 */

import prisma from '../../config/database';
import { generateContentHash } from '../../utils/crypto';
import logger from '../../config/logger';
import { ContributionType, VERAContribution, VERACertificate } from '../../types';

interface CreateContributionData {
  messageId: string;
  agentId: string;
  contributionType: ContributionType;
  content: string;
  metadata?: Record<string, any>;
}

/**
 * Create VERA contribution record
 * Records AI contribution with SHA-256 hash for immutable proof
 */
export async function createContribution(
  data: CreateContributionData
): Promise<VERAContribution> {
  // Generate content hash (SHA-256)
  const contentHash = generateContentHash(data.content);

  // Create contribution record
  const contribution = await prisma.vERAContribution.create({
    data: {
      messageId: data.messageId,
      agentId: data.agentId,
      contributionType: data.contributionType,
      content: data.content,
      contentHash,
      metadata: data.metadata || {},
      verifiedAt: new Date(),
    },
  });

  logger.info('VERA contribution recorded', {
    contributionId: contribution.id,
    agentId: data.agentId,
    messageId: data.messageId,
    contentHash,
  });

  return contribution as VERAContribution;
}

/**
 * Verify contribution integrity
 * Checks if content matches its hash
 */
export async function verifyContribution(
  contributionId: string
): Promise<{ valid: boolean; reason?: string }> {
  const contribution = await prisma.vERAContribution.findUnique({
    where: { id: contributionId },
  });

  if (!contribution) {
    return { valid: false, reason: 'Contribution not found' };
  }

  // Regenerate hash from content
  const calculatedHash = generateContentHash(contribution.content);

  // Compare with stored hash
  if (calculatedHash !== contribution.contentHash) {
    logger.warn('VERA integrity violation detected', {
      contributionId,
      storedHash: contribution.contentHash,
      calculatedHash,
    });
    return { valid: false, reason: 'Content hash mismatch - possible tampering' };
  }

  return { valid: true };
}

/**
 * Get all contributions for a message
 */
export async function getMessageContributions(
  messageId: string
): Promise<VERAContribution[]> {
  const contributions = await prisma.vERAContribution.findMany({
    where: { messageId },
    include: {
      agent: {
        select: {
          id: true,
          name: true,
          role: true,
          provider: true,
        },
      },
    },
    orderBy: { verifiedAt: 'asc' },
  });

  return contributions as any;
}

/**
 * Get all contributions by an agent
 */
export async function getAgentContributions(
  agentId: string,
  options?: {
    projectId?: string;
    startDate?: Date;
    endDate?: Date;
    contributionType?: ContributionType;
  }
): Promise<VERAContribution[]> {
  const where: any = { agentId };

  if (options?.projectId) {
    where.message = {
      channel: {
        projectId: options.projectId,
      },
    };
  }

  if (options?.startDate || options?.endDate) {
    where.verifiedAt = {};
    if (options.startDate) where.verifiedAt.gte = options.startDate;
    if (options.endDate) where.verifiedAt.lte = options.endDate;
  }

  if (options?.contributionType) {
    where.contributionType = options.contributionType;
  }

  const contributions = await prisma.vERAContribution.findMany({
    where,
    include: {
      message: {
        select: {
          id: true,
          content: true,
          createdAt: true,
          channel: {
            select: {
              id: true,
              name: true,
              project: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { verifiedAt: 'desc' },
  });

  return contributions as any;
}

/**
 * Get contribution statistics for an agent
 */
export async function getAgentContributionStats(
  agentId: string,
  projectId?: string
) {
  const where: any = { agentId };

  if (projectId) {
    where.message = {
      channel: {
        projectId,
      },
    };
  }

  const [
    totalContributions,
    contributionsByType,
    totalTokens,
  ] = await Promise.all([
    // Total contributions
    prisma.vERAContribution.count({ where }),

    // Contributions by type
    prisma.vERAContribution.groupBy({
      by: ['contributionType'],
      where,
      _count: true,
    }),

    // Total tokens (from metadata if available)
    prisma.vERAContribution.aggregate({
      where,
      _sum: {
        // We'll store token count in metadata
        // For now, return 0 as placeholder
      },
    }),
  ]);

  return {
    totalContributions,
    contributionsByType: contributionsByType.map((item) => ({
      type: item.contributionType,
      count: item._count,
    })),
    totalTokens: 0, // Placeholder - will be calculated from metadata
  };
}

/**
 * Generate VERA certificate for an agent's contributions to a project
 */
export async function generateCertificate(
  agentId: string,
  projectId: string
): Promise<VERACertificate> {
  // Get contribution stats
  const stats = await getAgentContributionStats(agentId, projectId);

  // Get contribution types
  const contributionTypes = stats.contributionsByType.map(
    (item) => item.type as ContributionType
  );

  // Create certificate record
  const certificate = await prisma.vERACertificate.create({
    data: {
      projectId,
      agentId,
      contributionCount: stats.totalContributions,
      contributionTypes,
      totalTokens: stats.totalTokens,
      generatedAt: new Date(),
      certificateUrl: '', // Will be generated separately (PDF generation)
    },
  });

  logger.info('VERA certificate generated', {
    certificateId: certificate.id,
    agentId,
    projectId,
    contributionCount: stats.totalContributions,
  });

  return certificate as VERACertificate;
}

/**
 * Verify certificate authenticity
 */
export async function verifyCertificate(
  certificateId: string
): Promise<{ valid: boolean; certificate?: VERACertificate; reason?: string }> {
  const certificate = await prisma.vERACertificate.findUnique({
    where: { id: certificateId },
    include: {
      agent: {
        select: {
          id: true,
          name: true,
          role: true,
          provider: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!certificate) {
    return { valid: false, reason: 'Certificate not found' };
  }

  // Verify contribution count matches
  const actualCount = await prisma.vERAContribution.count({
    where: {
      agentId: certificate.agentId,
      message: {
        channel: {
          projectId: certificate.projectId,
        },
      },
    },
  });

  if (actualCount !== certificate.contributionCount) {
    return {
      valid: false,
      reason: 'Contribution count mismatch',
      certificate: certificate as any,
    };
  }

  return { valid: true, certificate: certificate as any };
}

/**
 * Export VERA ledger for blockchain migration
 * Prepares data in format suitable for blockchain storage
 */
export async function exportLedgerForBlockchain(
  projectId?: string
): Promise<any[]> {
  const where = projectId
    ? {
        message: {
          channel: {
            projectId,
          },
        },
      }
    : {};

  const contributions = await prisma.vERAContribution.findMany({
    where,
    include: {
      agent: {
        select: {
          id: true,
          name: true,
          provider: true,
        },
      },
      message: {
        select: {
          id: true,
          channelId: true,
          createdAt: true,
        },
      },
    },
    orderBy: { verifiedAt: 'asc' },
  });

  // Format for blockchain (simplified structure)
  return contributions.map((contrib, index) => ({
    blockNumber: index + 1,
    timestamp: contrib.verifiedAt.toISOString(),
    contributionId: contrib.id,
    agentId: contrib.agentId,
    agentName: contrib.agent.name,
    provider: contrib.agent.provider,
    messageId: contrib.messageId,
    channelId: contrib.message.channelId,
    contributionType: contrib.contributionType,
    contentHash: contrib.contentHash,
    metadata: contrib.metadata,
  }));
}
