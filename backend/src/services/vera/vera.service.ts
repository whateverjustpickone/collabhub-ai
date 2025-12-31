/**
 * VERA Attribution Service (Phase 1)
 * Virtual Ethical Resource Attribution
 *
 * Tracks all contributions in the Digital Muse ecosystem:
 * - Human user input and decisions
 * - AI agent contributions (local and cloud)
 * - Routing decisions (local/hybrid/cloud)
 * - Synthesis contributions (who said what)
 * - Cost and performance metrics
 *
 * Phase 1: PostgreSQL + SHA-256 hashing
 * Phase 2: Blockchain migration (planned)
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface VeraRoutingAttribution {
  projectId: string;
  userId?: string;
  query: string;
  routingStrategy: 'local' | 'hybrid' | 'cloud-full';
  triageResult: {
    complexity: string;
    reasoning: string;
    estimatedCost: number;
  };
  agentsConsulted: string[];
  executionTimeMs: number;
  actualCost: number;
  costSavings?: number; // vs naive multi-LLM approach
}

export interface VeraSynthesisAttribution {
  projectId: string;
  query: string;
  agentContributions: Array<{
    agent: string;
    content: string;
    confidence: number;
    tokensGenerated?: number;
    cost?: number;
  }>;
  synthesizedBy: string; // 'digital-muse' or agent ID
  finalAnswer: string;
}

export interface VeraHumanContribution {
  projectId: string;
  userId: string;
  contributionType: 'DECISION' | 'INPUT' | 'APPROVAL' | 'REJECTION' | 'EDIT';
  content: string;
  context?: string;
  relatedEntityId?: string; // task_id, message_id, etc.
}

export interface VeraAgentContribution {
  projectId: string;
  agentId: string;
  contributionType: 'GENERATION' | 'ANALYSIS' | 'SYNTHESIS' | 'REVIEW';
  content: string;
  context?: string;
  metadata?: Record<string, any>;
}

export interface VeraAttributionRecord {
  id: string;
  contentHash: string;
  blockchainHash?: string;
  impactScore: number;
  verified: boolean;
  createdAt: Date;
}

// ============================================
// VERA SERVICE CLASS
// ============================================

export class VeraService {
  /**
   * Track a routing decision made by Digital Muse
   */
  async trackRouting(attribution: VeraRoutingAttribution): Promise<VeraAttributionRecord> {
    try {
      // Create content summary
      const contentSummary = `Query routed via ${attribution.routingStrategy} strategy. ` +
        `Agents consulted: ${attribution.agentsConsulted.join(', ')}. ` +
        `Execution: ${attribution.executionTimeMs}ms, Cost: $${attribution.actualCost.toFixed(4)}`;

      // Create full content for hashing
      const fullContent = JSON.stringify({
        type: 'routing_decision',
        timestamp: new Date().toISOString(),
        ...attribution,
      });

      const contentHash = this.generateHash(fullContent);

      // Calculate impact score (based on complexity and cost savings)
      const impactScore = this.calculateRoutingImpactScore(attribution);

      // Store in VERA ledger
      const veraRecord = await prisma.veraLedger.create({
        data: {
          projectId: attribution.projectId,
          interactionType: 'DECISION',
          fromEntity: 'digital-muse', // Digital Muse made the routing decision
          toEntity: attribution.userId || null,
          contentSummary,
          contentHash,
          fullContentEncrypt: fullContent, // TODO: Encrypt in Phase 2
          impactScore,
          contributionType: 'COORDINATION',
          verified: false, // Will be verified in Phase 2 blockchain
        },
      });

      console.log('[VeraService] Routing decision tracked', {
        id: veraRecord.id,
        strategy: attribution.routingStrategy,
        impactScore,
      });

      return {
        id: veraRecord.id,
        contentHash: veraRecord.contentHash,
        impactScore: veraRecord.impactScore,
        verified: veraRecord.verified,
        createdAt: veraRecord.createdAt,
      };
    } catch (error: any) {
      console.error('[VeraService] Failed to track routing', {
        error: error.message,
      });
      throw error;
    }
  }

/**
   * Track agent synthesis contributions
   */
  async trackSynthesis(attribution: VeraSynthesisAttribution): Promise<VeraAttributionRecord> {
    try {
      // Create detailed content summary
      const agentSummary = attribution.agentContributions
        .map((ac) => `${ac.agent} (confidence: ${ac.confidence})`)
        .join(', ');

      const contentSummary = `Multi-agent synthesis: ${attribution.agentContributions.length} agents contributed. ` +
        `Synthesized by ${attribution.synthesizedBy}. Agents: ${agentSummary}`;

      // Create full content for hashing (includes individual contributions)
      const fullContent = JSON.stringify({
        type: 'synthesis',
        timestamp: new Date().toISOString(),
        ...attribution,
      });

      const contentHash = this.generateHash(fullContent);

      // Calculate impact score (synthesis is high impact)
      const impactScore = this.calculateSynthesisImpactScore(attribution);

      // Store in VERA ledger
      const veraRecord = await prisma.veraLedger.create({
        data: {
          projectId: attribution.projectId,
          interactionType: 'RESEARCH',
          fromEntity: attribution.synthesizedBy,
          toEntity: null,
          contentSummary,
          contentHash,
          fullContentEncrypt: fullContent,
          impactScore,
          contributionType: 'EXECUTION',
          verified: false,
        },
      });

      // Also track individual agent contributions
      await Promise.all(
        attribution.agentContributions.map((agentContrib) =>
          this.trackAgentContribution({
            projectId: attribution.projectId,
            agentId: agentContrib.agent,
            contributionType: 'GENERATION',
            content: agentContrib.content,
            context: `Part of synthesis for query: ${attribution.query.substring(0, 100)}...`,
            metadata: {
              confidence: agentContrib.confidence,
              tokensGenerated: agentContrib.tokensGenerated,
              cost: agentContrib.cost,
              synthesisRecordId: veraRecord.id,
            },
          })
        )
      );

      console.log('[VeraService] Synthesis tracked', {
        id: veraRecord.id,
        agentsCount: attribution.agentContributions.length,
        impactScore,
      });

      return {
        id: veraRecord.id,
        contentHash: veraRecord.contentHash,
        impactScore: veraRecord.impactScore,
        verified: veraRecord.verified,
        createdAt: veraRecord.createdAt,
      };
    } catch (error: any) {
      console.error('[VeraService] Failed to track synthesis', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Track human contribution
   */
  async trackHumanContribution(contribution: VeraHumanContribution): Promise<VeraAttributionRecord> {
    try {
      const contentSummary = `Human ${contribution.contributionType.toLowerCase()}: ${contribution.content.substring(0, 200)}`;

      const fullContent = JSON.stringify({
        type: 'human_contribution',
        timestamp: new Date().toISOString(),
        ...contribution,
      });

      const contentHash = this.generateHash(fullContent);

      // Human contributions have high impact
      const impactScore = this.calculateHumanImpactScore(contribution);

      const veraRecord = await prisma.veraLedger.create({
        data: {
          projectId: contribution.projectId,
          interactionType: this.mapContributionTypeToInteraction(contribution.contributionType),
          fromEntity: contribution.userId,
          toEntity: contribution.relatedEntityId || null,
          contentSummary,
          contentHash,
          fullContentEncrypt: fullContent,
          impactScore,
          contributionType: this.mapContributionType(contribution.contributionType),
          verified: false,
        },
      });

      console.log('[VeraService] Human contribution tracked', {
        id: veraRecord.id,
        userId: contribution.userId,
        type: contribution.contributionType,
      });

      return {
        id: veraRecord.id,
        contentHash: veraRecord.contentHash,
        impactScore: veraRecord.impactScore,
        verified: veraRecord.verified,
        createdAt: veraRecord.createdAt,
      };
    } catch (error: any) {
      console.error('[VeraService] Failed to track human contribution', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Track agent contribution
   */
  async trackAgentContribution(contribution: VeraAgentContribution): Promise<VeraAttributionRecord> {
    try {
      const contentSummary = `Agent ${contribution.agentId} ${contribution.contributionType.toLowerCase()}: ${contribution.content.substring(0, 200)}`;

      const fullContent = JSON.stringify({
        type: 'agent_contribution',
        timestamp: new Date().toISOString(),
        ...contribution,
      });

      const contentHash = this.generateHash(fullContent);
      const impactScore = this.calculateAgentImpactScore(contribution);

      const veraRecord = await prisma.veraLedger.create({
        data: {
          projectId: contribution.projectId,
          interactionType: this.mapAgentContributionTypeToInteraction(contribution.contributionType),
          fromEntity: contribution.agentId,
          toEntity: null,
          contentSummary,
          contentHash,
          fullContentEncrypt: fullContent,
          impactScore,
          contributionType: this.mapAgentContributionType(contribution.contributionType),
          verified: false,
        },
      });

      return {
        id: veraRecord.id,
        contentHash: veraRecord.contentHash,
        impactScore: veraRecord.impactScore,
        verified: veraRecord.verified,
        createdAt: veraRecord.createdAt,
      };
    } catch (error: any) {
      console.error('[VeraService] Failed to track agent contribution', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Verify contribution integrity
   * Checks if content matches its hash
   */
  async verifyContribution(
    contributionId: string
  ): Promise<{ valid: boolean; reason?: string }> {
    const contribution = await prisma.veraLedger.findUnique({
      where: { id: contributionId },
    });

    if (!contribution) {
      return { valid: false, reason: 'Contribution not found' };
    }

    // Regenerate hash from content
    const calculatedHash = this.generateHash(contribution.fullContentEncrypt || '');

    // Compare with stored hash
    if (calculatedHash !== contribution.contentHash) {
      console.warn('[VeraService] Integrity violation detected', {
        contributionId,
        storedHash: contribution.contentHash,
        calculatedHash,
      });
      return { valid: false, reason: 'Content hash mismatch - possible tampering' };
    }

    return { valid: true };
  }

/**
   * Get attribution history for a project
   */
  async getProjectAttributions(
    projectId: string,
    options?: {
      limit?: number;
      offset?: number;
      contributionType?: string;
      fromEntity?: string;
    }
  ): Promise<VeraAttributionRecord[]> {
    try {
      const records = await prisma.veraLedger.findMany({
        where: {
          projectId,
          ...(options?.contributionType && { contributionType: options.contributionType as any }),
          ...(options?.fromEntity && { fromEntity: options.fromEntity }),
        },
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 100,
        skip: options?.offset || 0,
      });

      return records.map((r) => ({
        id: r.id,
        contentHash: r.contentHash,
        blockchainHash: r.blockchainHash || undefined,
        impactScore: r.impactScore,
        verified: r.verified,
        createdAt: r.createdAt,
      }));
    } catch (error: any) {
      console.error('[VeraService] Failed to get attributions', {
        error: error.message,
      });
      return [];
    }
  }

/**
   * Get attribution statistics for a project
   */
  async getAttributionStats(projectId: string): Promise<{
    totalContributions: number;
    humanContributions: number;
    aiContributions: number;
    routingDecisions: number;
    syntheses: number;
    totalImpactScore: number;
    averageImpactScore: number;
    costSavings: number;
  }> {
    try {
      const records = await prisma.veraLedger.findMany({
        where: { projectId },
      });

      const humanContributions = records.filter((r) => !r.fromEntity.startsWith('digital-muse') && !r.fromEntity.includes('-')).length;
      const aiContributions = records.length - humanContributions;

      // Parse routing decisions to calculate cost savings
      let routingDecisions = 0;
      let syntheses = 0;
      let totalCostSavings = 0;

      records.forEach((r) => {
        if (r.interactionType === 'DECISION' && r.fromEntity === 'digital-muse') {
          routingDecisions++;
          // Parse cost savings from full content
          try {
            const content = JSON.parse(r.fullContentEncrypt || '{}');
            if (content.costSavings) {
              totalCostSavings += content.costSavings;
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
        if (r.interactionType === 'RESEARCH' && r.contributionType === 'EXECUTION') {
          syntheses++;
        }
      });

      const totalImpactScore = records.reduce((sum, r) => sum + r.impactScore, 0);
      const averageImpactScore = records.length > 0 ? totalImpactScore / records.length : 0;

      return {
        totalContributions: records.length,
        humanContributions,
        aiContributions,
        routingDecisions,
        syntheses,
        totalImpactScore,
        averageImpactScore,
        costSavings: totalCostSavings,
      };
    } catch (error: any) {
      console.error('[VeraService] Failed to get attribution stats', {
        error: error.message,
      });
      return {
        totalContributions: 0,
        humanContributions: 0,
        aiContributions: 0,
        routingDecisions: 0,
        syntheses: 0,
        totalImpactScore: 0,
        averageImpactScore: 0,
        costSavings: 0,
      };
    }
  }

  /**
   * Verify an attribution record (Phase 2 - blockchain)
   */
  async verifyAttribution(attributionId: string, blockchainHash: string): Promise<void> {
    try {
      await prisma.veraLedger.update({
        where: { id: attributionId },
        data: {
          blockchainHash,
          verified: true,
        },
      });

      console.log('[VeraService] Attribution verified', {
        id: attributionId,
        blockchainHash,
      });
    } catch (error: any) {
      console.error('[VeraService] Failed to verify attribution', {
        error: error.message,
      });
      throw error;
    }
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private generateHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private calculateRoutingImpactScore(attribution: VeraRoutingAttribution): number {
    // Base score: 3.0 (routing decisions are moderately important)
    let score = 3.0;

    // Add score based on complexity
    if (attribution.triageResult.complexity === 'complex') {
      score += 2.0;
    } else if (attribution.triageResult.complexity === 'moderate') {
      score += 1.0;
    }

    // Add score based on cost savings
    if (attribution.costSavings && attribution.costSavings > 0) {
      score += Math.min(attribution.costSavings * 10, 3.0); // Cap at 3.0
    }

    // Add score based on number of agents (more agents = more coordination impact)
    score += attribution.agentsConsulted.length * 0.5;

    return Math.min(score, 10.0); // Cap at 10.0
  }

  private calculateSynthesisImpactScore(attribution: VeraSynthesisAttribution): number {
    // Base score: 7.0 (synthesis is high impact)
    let score = 7.0;

    // Add score based on number of agents synthesized
    score += attribution.agentContributions.length * 0.5;

    // Add score based on average confidence
    const avgConfidence =
      attribution.agentContributions.reduce((sum, ac) => sum + ac.confidence, 0) /
      attribution.agentContributions.length;
    score += avgConfidence * 2.0;

    return Math.min(score, 10.0);
  }

  private calculateHumanImpactScore(contribution: VeraHumanContribution): number {
    // Human contributions are always high impact
    const baseScores = {
      DECISION: 8.0,
      APPROVAL: 7.0,
      REJECTION: 7.0,
      EDIT: 6.0,
      INPUT: 5.0,
    };

    return baseScores[contribution.contributionType] || 5.0;
  }

  private calculateAgentImpactScore(contribution: VeraAgentContribution): number {
    const baseScores = {
      GENERATION: 5.0,
      ANALYSIS: 6.0,
      SYNTHESIS: 7.0,
      REVIEW: 6.0,
    };

    return baseScores[contribution.contributionType] || 5.0;
  }

  private mapContributionTypeToInteraction(
    type: VeraHumanContribution['contributionType']
  ): string {
    const mapping = {
      DECISION: 'DECISION',
      INPUT: 'MESSAGE',
      APPROVAL: 'APPROVAL',
      REJECTION: 'APPROVAL',
      EDIT: 'MESSAGE',
    };
    return mapping[type];
  }

  private mapContributionType(type: VeraHumanContribution['contributionType']): string {
    const mapping = {
      DECISION: 'PLANNING',
      INPUT: 'EXECUTION',
      APPROVAL: 'REVIEW',
      REJECTION: 'REVIEW',
      EDIT: 'EXECUTION',
    };
    return mapping[type];
  }

  private mapAgentContributionTypeToInteraction(
    type: VeraAgentContribution['contributionType']
  ): string {
    const mapping = {
      GENERATION: 'CODE_GENERATION',
      ANALYSIS: 'RESEARCH',
      SYNTHESIS: 'RESEARCH',
      REVIEW: 'REVIEW',
    };
    return mapping[type];
  }

  private mapAgentContributionType(type: VeraAgentContribution['contributionType']): string {
    const mapping = {
      GENERATION: 'EXECUTION',
      ANALYSIS: 'RESEARCH',
      SYNTHESIS: 'EXECUTION',
      REVIEW: 'REVIEW',
    };
    return mapping[type];
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let veraServiceInstance: VeraService | null = null;

export function getVeraService(): VeraService {
  if (!veraServiceInstance) {
    veraServiceInstance = new VeraService();
  }
  return veraServiceInstance;
}
