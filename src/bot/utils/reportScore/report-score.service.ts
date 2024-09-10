import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EmbedBuilder, Message } from "discord.js";
import { TABLE } from "src/bot/constants/table";
import { User } from "src/bot/models/user.entity";
import { Repository } from "typeorm";
import { UtilsService } from "../utils.service";

@Injectable()
export class ReportScoreService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private utilsService: UtilsService
  ) {}

  async reportScore(message: Message) {
    try {
      const userid = message.author.id;
      const username = message.author.username;

      if (!userid || !username) return;

      const scoresQuizData = await this.userRepository
        .createQueryBuilder()
        .andWhere(`"deactive" IS NOT TRUE and user_type is null`)
        .orderBy(`"scores_quiz"`, "DESC")
        .limit(10)
        .select("*")
        .execute();

      let mess;
      if (Array.isArray(scoresQuizData) && scoresQuizData.length === 0) {
        mess = "```" + "no result" + "```";
      } else {
        mess = scoresQuizData
          .map(
            (item) =>
              `<@${item.userId}>(${item.username}) - ${
                item.scores_quiz || 0
              } points`
          )
          .join("\n");
      }

      const Embed = new EmbedBuilder()
        .setTitle("Top 10 quiz points")
        .setColor("Red")
        .setDescription(`${mess}`);
      return message.reply({ embeds: [Embed] }).catch(console.error);
    } catch (error) {
      console.log(error);
    }
  }
}
