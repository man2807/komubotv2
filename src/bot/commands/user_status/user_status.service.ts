import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/bot/models/user.entity";
import { Repository } from "typeorm";

@Injectable()
export class UserStatusService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async getUserStatus(email) {
    return await this.userRepository
      .createQueryBuilder()
      .where(`"email" = :email`, { email: email })
      .orWhere(`"username" = :username`, { username: email })
      .andWhere('user_type is null')
      .select("*")
      .execute();
  }
}
