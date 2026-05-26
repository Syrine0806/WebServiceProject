import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, Role } from '../users/user.entity';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
import { AuthResponse } from './dto/auth-response';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(input: RegisterInput): Promise<AuthResponse> {
    const existing = await this.userRepo.findOne({
      where: { email: input.email },
    });
    if (existing) throw new ConflictException('Email already registered');
    const hashed = await bcrypt.hash(input.password, 10);
    const user = this.userRepo.create({ ...input, password: hashed, role: Role.OPERATOR });
    await this.userRepo.save(user);
    const accessToken = this.generateToken(user);
    return { accessToken, user };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await this.userRepo.findOne({
      where: { email: input.email },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(input.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    const accessToken = this.generateToken(user);
    return { accessToken, user };
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async findAll(): Promise<User[]> {
    return this.userRepo.find();
  }

  private generateToken(user: User): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }
}
