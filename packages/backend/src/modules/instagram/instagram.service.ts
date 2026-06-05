import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InstagramService {
  private readonly logger = new Logger(InstagramService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Verify webhook challenge from Meta
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || 'servcand-webhook-token';
    if (mode === 'subscribe' && token === verifyToken) {
      this.logger.log('Webhook verified successfully');
      return challenge;
    }
    return null;
  }

  // Handle incoming webhook events from Instagram/Meta
  async handleWebhook(body: any, headers?: any) {
    this.logger.log(`Webhook received: ${JSON.stringify(body)}`);

    try {
      await this.prisma.instagramWebhookLog.create({
        data: {
          payload: body,
          headers: headers ? headers : {},
        },
      });
    } catch (err) {
      this.logger.error(`Failed to save webhook log: ${err.message}`);
    }

    if (body.object === 'instagram') {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field === 'mentions') {
            await this.handleMention(change.value);
          } else if (change.field === 'comments') {
            await this.handleComment(change.value);
          } else if (change.field === 'story_insights') {
            await this.handleStoryInsight(change.value);
          }
        }
      }
    }

    return { status: 'received' };
  }

  private async handleMention(data: any) {
    this.logger.log(`Handling mention: ${JSON.stringify(data)}`);
    // Find person by instagram ID
    const person = await this.prisma.person.findFirst({
      where: { instagramId: data.mentioned_media_id || data.media_id },
    });

    if (person) {
      await this.upsertInstagramPost(person.id, data, { hasTag: true });
    }
  }

  private async handleComment(data: any) {
    this.logger.log(`Handling comment: ${JSON.stringify(data)}`);
    const person = await this.prisma.person.findFirst({
      where: { instagramUsername: data.from?.username },
    });

    if (person) {
      await this.upsertInstagramPost(person.id, data, { hasComment: true });
    }
  }

  private async handleStoryInsight(data: any) {
    this.logger.log(`Handling story insight: ${JSON.stringify(data)}`);
  }

  private async upsertInstagramPost(personId: string, data: any, updates: any) {
    const postId = data.media_id || data.id || `manual-${Date.now()}`;

    const existing = await this.prisma.instagramPost.findFirst({
      where: { instagramPostId: postId, personId },
    });

    if (existing) {
      await this.prisma.instagramPost.update({
        where: { id: existing.id },
        data: { ...updates, status: 'VALIDATING' },
      });
    } else {
      await this.prisma.instagramPost.create({
        data: {
          personId,
          instagramPostId: postId,
          timestamp: new Date(),
          rawData: data,
          status: 'VALIDATING',
          hasPhoto: true,
          ...updates,
        },
      });
    }

    // Auto-validate missions based on post data
    await this.autoValidateMissions(personId, postId);
  }

  // Auto-validate missions based on instagram post
  async autoValidateMissions(personId: string, postId: string) {
    const post = await this.prisma.instagramPost.findFirst({
      where: { instagramPostId: postId, personId },
    });
    if (!post) return;

    const person = await this.prisma.person.findUnique({ where: { id: personId } });
    if (!person) return;

    const missions = await this.prisma.mission.findMany({
      where: { companyId: person.companyId, isActive: true },
    });

    const now = new Date();
    const weekNumber = this.getWeekNumber(now);
    const year = now.getFullYear();

    for (const mission of missions) {
      let shouldComplete = false;

      if (mission.type === 'POST_PHOTO' && post.hasPhoto) shouldComplete = true;
      if (mission.type === 'TAG_COMPANY' && post.hasTag) shouldComplete = true;
      if (mission.type === 'COMMENT_POST' && post.hasComment) shouldComplete = true;
      if (mission.type === 'SHARE_POST' && post.hasShare) shouldComplete = true;

      if (shouldComplete) {
        await this.prisma.personMission.upsert({
          where: {
            personId_missionId_weekNumber_year: {
              personId, missionId: mission.id, weekNumber, year,
            },
          },
          update: { status: 'COMPLETED', completedAt: now, evidence: post.mediaUrl, points: mission.points },
          create: {
            personId, missionId: mission.id, weekNumber, year,
            status: 'COMPLETED', completedAt: now, evidence: post.mediaUrl, points: mission.points,
          },
        });

        await this.prisma.person.update({
          where: { id: personId },
          data: { totalPoints: { increment: mission.points } },
        });
      }
    }

    // Mark post as validated
    await this.prisma.instagramPost.updateMany({
      where: { instagramPostId: postId, personId },
      data: { status: 'VALIDATED', validatedAt: now },
    });
  }

  async findPostsByPerson(personId: string, query: any = {}) {
    return this.prisma.instagramPost.findMany({
      where: { personId },
      orderBy: { timestamp: 'desc' },
    });
  }

  async createManualPost(data: {
    personId: string;
    instagramPostId: string;
    mediaUrl?: string;
    caption?: string;
    hasTag?: boolean;
    hasComment?: boolean;
    hasShare?: boolean;
  }) {
    const post = await this.prisma.instagramPost.upsert({
      where: { instagramPostId: data.instagramPostId },
      update: data,
      create: {
        ...data,
        timestamp: new Date(),
        hasPhoto: true,
        status: 'VALIDATING',
      },
    });

    await this.autoValidateMissions(data.personId, data.instagramPostId);
    return post;
  }

  async getConfig(companyId: string) {
    return this.prisma.instagramConfig.findUnique({ where: { companyId } });
  }

  async upsertConfig(companyId: string, config: any) {
    return this.prisma.instagramConfig.upsert({
      where: { companyId },
      update: config,
      create: { companyId, ...config },
    });
  }

  async getWebhookLogs(limit: number = 50) {
    return this.prisma.instagramWebhookLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }
}
