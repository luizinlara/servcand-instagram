import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user with profile and permissions
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        company: true,
        profile: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
        person: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User is inactive');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const permissions = user.profile.permissions.map((pp) => pp.permission.name);

    const payload = {
      sub: user.id,
      email: user.email,
      companyId: user.companyId,
      profileId: user.profileId,
      profileName: user.profile.name,
      permissions,
      isAdmin: user.company.isAdmin,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
      },
    );

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        companyId: user.companyId,
        companyName: user.company.name,
        isAdmin: user.company.isAdmin,
        profile: {
          id: user.profile.id,
          name: user.profile.name,
        },
        permissions,
        person: user.person,
      },
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const stored = await this.prisma.refreshToken.findUnique({
        where: { token },
        include: {
          user: {
            include: {
              company: true,
              profile: {
                include: {
                  permissions: { include: { permission: true } },
                },
              },
            },
          },
        },
      });

      if (!stored || stored.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = stored.user;
      const permissions = user.profile.permissions.map((pp) => pp.permission.name);

      const newPayload = {
        sub: user.id,
        email: user.email,
        companyId: user.companyId,
        profileId: user.profileId,
        profileName: user.profile.name,
        permissions,
        isAdmin: user.company.isAdmin,
      };

      const accessToken = this.jwtService.sign(newPayload);
      return { accessToken };
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    } else {
      // Delete all refresh tokens for user
      await this.prisma.refreshToken.deleteMany({
        where: { userId },
      });
    }
    return { message: 'Logged out successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        companyId: true,
        isActive: true,
        lastLoginAt: true,
        company: { select: { id: true, name: true, isAdmin: true } },
        profile: {
          select: {
            id: true,
            name: true,
            description: true,
            permissions: { include: { permission: true } },
          },
        },
        person: true,
      },
    });

    if (!user) throw new UnauthorizedException('User not found');

    return {
      ...user,
      permissions: user.profile.permissions.map((pp) => pp.permission.name),
    };
  }
}
