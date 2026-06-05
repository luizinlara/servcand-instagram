import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';


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
        const instagramAccountId = entry.id;
        for (const change of entry.changes || []) {
          if (change.field === 'mentions') {
            await this.handleMention(change.value, instagramAccountId);
          } else if (change.field === 'comments') {
            await this.handleComment(change.value, instagramAccountId);
          } else if (change.field === 'story_insights') {
            await this.handleStoryInsight(change.value, instagramAccountId);
          }
        }
      }
    }

    return { status: 'received' };
  }

  private async handleMention(data: any, instagramAccountId: string) {
    this.logger.log(`Handling mention: ${JSON.stringify(data)}`);
    const config = await this.prisma.instagramConfig.findFirst({
      where: { instagramAccountId },
    });
    if (!config || !config.accessToken) return;

    const mediaId = data.media_id;
    if (!mediaId) return;

    const url = `https://graph.facebook.com/v19.0/${mediaId}?fields=id,username,owner,media_type,media_url,caption&access_token=${config.accessToken}`;
    try {
      const response = await axios.get(url);
      const mediaData = response.data;
      const username = mediaData.username || mediaData.owner?.username;
      const ownerId = mediaData.owner?.id;

      if (username) {
        const person = await this.prisma.person.findFirst({
          where: { instagramUsername: username },
        });

        if (person) {
          if (!person.instagramId && ownerId) {
            await this.prisma.person.update({
              where: { id: person.id },
              data: { instagramId: ownerId },
            });
            person.instagramId = ownerId;
          }
          await this.upsertInstagramPost(person.id, mediaData, { hasTag: true });
        }
      }
    } catch (err: any) {
      this.logger.error(`Failed to handle mention for media ${mediaId}: ${err.message}`);
    }
  }

  private async handleComment(data: any, instagramAccountId: string) {
    this.logger.log(`Handling comment: ${JSON.stringify(data)}`);
    const username = data.from?.username;
    const fromId = data.from?.id;
    if (!username) return;

    const person = await this.prisma.person.findFirst({
      where: { instagramUsername: username },
    });

    if (person) {
      if (!person.instagramId && fromId) {
        await this.prisma.person.update({
          where: { id: person.id },
          data: { instagramId: fromId },
        });
        person.instagramId = fromId;
      }
      await this.upsertInstagramPost(person.id, data, { hasComment: true });
    }
  }

  private async handleStoryInsight(data: any, instagramAccountId: string) {
    this.logger.log(`Handling story insight: ${JSON.stringify(data)}`);
  }

  async checkInstagramFollowStatus(personId: string): Promise<boolean> {
    const person = await this.prisma.person.findUnique({ where: { id: personId } });
    if (!person || !person.instagramId) return false;

    const config = await this.prisma.instagramConfig.findUnique({
      where: { companyId: person.companyId },
    });
    if (!config || !config.accessToken || !config.isActive) return false;

    const url = `https://graph.facebook.com/v19.0/${person.instagramId}?fields=is_user_follow_business&access_token=${config.accessToken}`;
    try {
      const response = await axios.get(url);
      return !!response.data.is_user_follow_business;
    } catch (err: any) {
      this.logger.error(`Failed to check follow status for user ${person.instagramId}: ${err.message}`);
      return false;
    }
  }

  private async downloadAndSavePhoto(mediaUrl: string, postId: string): Promise<string> {
    if (!mediaUrl) return mediaUrl;

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    if (mediaUrl.startsWith(backendUrl) || mediaUrl.startsWith('/uploads')) {
      return mediaUrl;
    }

    try {
      const response = await axios({
        url: mediaUrl,
        method: 'GET',
        responseType: 'arraybuffer',
        timeout: 15000,
      });

      const instagramDir = path.join(process.cwd(), 'uploads', 'instagram');
      if (!fs.existsSync(instagramDir)) {
        fs.mkdirSync(instagramDir, { recursive: true });
      }

      const extension = mediaUrl.includes('.png') ? 'png' : 'jpg';
      const fileName = `${postId}.${extension}`;
      const filePath = path.join(instagramDir, fileName);

      fs.writeFileSync(filePath, response.data);
      this.logger.log(`Photo downloaded and saved locally for post ${postId}`);

      return `${backendUrl}/uploads/instagram/${fileName}`;
    } catch (err: any) {
      this.logger.error(`Failed to download photo from ${mediaUrl}: ${err.message}`);
      return mediaUrl;
    }
  }

  private async upsertInstagramPost(personId: string, data: any, updates: any) {
    const postId = data.media_id || data.id || `manual-${Date.now()}`;

    let localMediaUrl = data.media_url || null;
    if (localMediaUrl) {
      localMediaUrl = await this.downloadAndSavePhoto(localMediaUrl, postId);
    }

    const existing = await this.prisma.instagramPost.findFirst({
      where: { instagramPostId: postId, personId },
    });

    if (existing) {
      await this.prisma.instagramPost.update({
        where: { id: existing.id },
        data: {
          ...updates,
          mediaUrl: localMediaUrl || existing.mediaUrl,
          status: 'VALIDATING',
        },
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
          mediaUrl: localMediaUrl,
          ...updates,
        },
      });
    }

    // Auto-validate missions based on post data
    await this.autoValidateMissions(personId, postId);
  }

  // Auto-validate missions based on instagram post or follow status
  async autoValidateMissions(personId: string, postId?: string) {
    const person = await this.prisma.person.findUnique({ where: { id: personId } });
    if (!person) return;

    const post = postId ? await this.prisma.instagramPost.findFirst({
      where: { instagramPostId: postId, personId },
    }) : null;

    const missions = await this.prisma.mission.findMany({
      where: { companyId: person.companyId, isActive: true },
    });

    const now = new Date();
    const weekNumber = this.getWeekNumber(now);
    const year = now.getFullYear();

    for (const mission of missions) {
      let shouldComplete = false;
      let evidence = post?.mediaUrl || 'Validado via API';

      if (post) {
        if (mission.type === 'POST_PHOTO' && post.hasPhoto) shouldComplete = true;
        if (mission.type === 'TAG_COMPANY' && post.hasTag) shouldComplete = true;
        if (mission.type === 'COMMENT_POST' && post.hasComment) shouldComplete = true;
        if (mission.type === 'SHARE_POST' && post.hasShare) shouldComplete = true;
      }

      if (mission.type === 'FOLLOW_PROFILE' && person.instagramId) {
        const isFollowing = await this.checkInstagramFollowStatus(personId);
        if (isFollowing) {
          shouldComplete = true;
          evidence = `Seguindo perfil comercial (ID: ${person.instagramId})`;
        }
      }

      if (shouldComplete) {
        const existingPM = await this.prisma.personMission.findUnique({
          where: {
            personId_missionId_weekNumber_year: {
              personId, missionId: mission.id, weekNumber, year,
            },
          },
        });

        const isNewCompletion = !existingPM || existingPM.status !== 'COMPLETED';

        await this.prisma.personMission.upsert({
          where: {
            personId_missionId_weekNumber_year: {
              personId, missionId: mission.id, weekNumber, year,
            },
          },
          update: { status: 'COMPLETED', completedAt: now, evidence, points: mission.points },
          create: {
            personId, missionId: mission.id, weekNumber, year,
            status: 'COMPLETED', completedAt: now, evidence, points: mission.points,
          },
        });

        if (isNewCompletion) {
          await this.prisma.person.update({
            where: { id: personId },
            data: { totalPoints: { increment: mission.points } },
          });
        }
      }
    }

    if (postId) {
      await this.prisma.instagramPost.updateMany({
        where: { instagramPostId: postId, personId },
        data: { status: 'VALIDATED', validatedAt: now },
      });
    }
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

  async validatePostsAgainstMeta(personId: string, weekNumber: number, year: number) {
    const person = await this.prisma.person.findUnique({ where: { id: personId } });
    if (!person) return;

    const config = await this.prisma.instagramConfig.findUnique({
      where: { companyId: person.companyId },
    });
    if (!config || !config.accessToken || !config.isActive) {
      this.logger.warn(`No active Instagram config found for company ${person.companyId}`);
      return;
    }

    const completedMissions = await this.prisma.personMission.findMany({
      where: {
        personId,
        weekNumber,
        year,
        status: 'COMPLETED',
      },
      include: { mission: true },
    });

    for (const pm of completedMissions) {
      if (pm.mission.type === 'FOLLOW_PROFILE') {
        const isFollowing = await this.checkInstagramFollowStatus(personId);
        if (!isFollowing) {
          await this.prisma.personMission.update({
            where: { id: pm.id },
            data: {
              status: 'PENDING',
              notes: 'Deixou de seguir o perfil comercial da empresa.',
            },
          });

          await this.prisma.person.update({
            where: { id: personId },
            data: { totalPoints: { decrement: pm.points } },
          });
        }
        continue;
      }

      let postField: keyof any = 'hasPhoto';
      if (pm.mission.type === 'POST_PHOTO') postField = 'hasPhoto';
      else if (pm.mission.type === 'TAG_COMPANY') postField = 'hasTag';
      else if (pm.mission.type === 'COMMENT_POST') postField = 'hasComment';
      else if (pm.mission.type === 'SHARE_POST') postField = 'hasShare';

      const post = await this.prisma.instagramPost.findFirst({
        where: {
          personId,
          [postField]: true,
          status: { in: ['VALIDATING', 'VALIDATED'] },
        },
        orderBy: { timestamp: 'desc' },
      });

      if (!post) continue;

      if (post.instagramPostId.startsWith('manual-')) {
        if (post.status !== 'VALIDATED') {
          await this.prisma.instagramPost.update({
            where: { id: post.id },
            data: { status: 'VALIDATED' },
          });
        }
        continue;
      }

      const url = `https://graph.facebook.com/v19.0/${post.instagramPostId}?fields=id,media_type,media_url,caption&access_token=${config.accessToken}`;
      try {
        const response = await axios.get(url);
        const metaData = response.data;

        let localMediaUrl = metaData.media_url || post.mediaUrl;
        if (localMediaUrl && (metaData.media_type === 'IMAGE' || metaData.media_type === 'CAROUSEL_ALBUM' || !metaData.media_type)) {
          localMediaUrl = await this.downloadAndSavePhoto(localMediaUrl, post.instagramPostId);
        }

        await this.prisma.instagramPost.update({
          where: { id: post.id },
          data: {
            status: 'VALIDATED',
            rawData: metaData,
            mediaUrl: localMediaUrl,
            caption: metaData.caption || post.caption,
          },
        });

        await this.prisma.personMission.update({
          where: { id: pm.id },
          data: { evidence: localMediaUrl },
        });
      } catch (err: any) {
        this.logger.warn(`Failed to validate post ${post.instagramPostId} via Meta API: ${err.message}`);

        await this.prisma.instagramPost.update({
          where: { id: post.id },
          data: { status: 'FAILED' },
        });

        await this.prisma.personMission.update({
          where: { id: pm.id },
          data: {
            status: 'PENDING',
            notes: `Inválido na API da Meta: ${err.message || 'Post não encontrado ou deletado'}`,
          },
        });

        await this.prisma.person.update({
          where: { id: personId },
          data: { totalPoints: { decrement: pm.points } },
        });
      }
    }
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }
}
