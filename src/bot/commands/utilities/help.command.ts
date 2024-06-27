import { DiscoveryService } from "@nestjs/core";
import { Client, EmbedBuilder, Message } from "discord.js";
import { CommandLine, CommandLineClass } from "src/bot/base/command.base";
import {
  DECORATOR_COMMAND,
  DECORATOR_COMMAND_LINE,
} from "src/bot/base/command.constans";
import { ExtendersService } from "src/bot/utils/extenders/extenders.service";
import { resolveCategory } from "src/bot/utils/function";
import { Logger } from "@nestjs/common";
import { ClientConfigService } from "src/bot/config/client-config.service";
import { DynamicService } from "../command/dynamic.service";

@CommandLine({
  name: "help",
  description:
    "  Affiche une liste de toutes les commandes actuelles, triées par catégorie. Peut être utilisé en conjonction avec une commande pour plus d'informations.",
  cat: "utilities",
})
export class HelpCommand implements CommandLineClass {
  private readonly logger = new Logger(HelpCommand.name);
  constructor(
    private extendersService: ExtendersService,
    private discoveryService: DiscoveryService,
    private clientConfig: ClientConfigService,
    private dynamicService: DynamicService
  ) {}

  async execute(e: Message, s, client, guildDB) {
    let t: any = [];
    let commands: any[] = [];
    if (!s.length) {
      this.discoveryService.getProviders().forEach((provider) => {
        if (typeof provider !== "string") {
          const instance = provider.instance;
          if (!instance || typeof instance === "string") return;
          if (!Reflect.getMetadata(DECORATOR_COMMAND_LINE, instance)) return;
          if (
            !Reflect.getMetadata(DECORATOR_COMMAND_LINE, instance)?.name ||
            !Reflect.getMetadata(DECORATOR_COMMAND_LINE, instance)?.description
          ) {
            this.logger.error(
              "please make property name and description in decorator @CommandLine"
            );
          }
          t.push({
            name: Reflect.getMetadata(DECORATOR_COMMAND_LINE, instance)?.name,
            description: Reflect.getMetadata(DECORATOR_COMMAND_LINE, instance)
              ?.description,
            cat: Reflect.getMetadata(DECORATOR_COMMAND_LINE, instance)?.cat,
          });
        }
      });

      this.discoveryService.getProviders().forEach((provider) => {
        if (typeof provider !== "string") {
          const instance = provider.instance;
          if (!instance || typeof instance === "string") return;
          if (!Reflect.getMetadata(DECORATOR_COMMAND, instance)) return;
          if (
            !Reflect.getMetadata(DECORATOR_COMMAND, instance)?.name ||
            !Reflect.getMetadata(DECORATOR_COMMAND, instance)?.description
          ) {
            this.logger.error(
              "please make property name and description in decorator @Command"
            );
          }
          commands.push({
            name: Reflect.getMetadata(DECORATOR_COMMAND, instance)?.name,
            description: Reflect.getMetadata(DECORATOR_COMMAND, instance)
              ?.description,
          });
        }
      });

      const o = await this.extendersService.translateMessage(
          "HELP_FOOTER",
          guildDB.lang
        ),
        m = guildDB.prefix;
      const E = await this.extendersService.translateMessage(
        "HELP_CAT",
        guildDB.lang
      );

      let arrCommand = await this.dynamicService.getAll();
      e.reply({
        embeds: [
          {
            color: 1752220,
            author: {
              name: "KOMU - Help Menu",
              icon_url: e.client.user.displayAvatarURL({
                // dynamic: !0,
                size: 512,
              }),
            },
            footer: {
              text: o.replace("{prefix}", m),
              icon_url: e.client.user.displayAvatarURL({
                // dynamic: !0,
                size: 512,
              }),
            },
            description:
              "A detailed list of commands can be found here: [" +
              this.clientConfig.linkwebsite +
              "/commands](https://komu.vn/commands)\nWant to listen rich quality music with me? [Invite me](" +
              this.clientConfig.linkinvite +
              ")",
            fields: [
              {
                name:
                  "• KOMU (" +
                  t.filter((item) => item.cat === "komu").length +
                  ")",
                value: t
                  .filter((item) => item.cat === "komu")
                  .map((item) => `\`${item.name}\``)
                  .join(", "),
              },
              {
                name: "• Custom commands (" + arrCommand.length + ")",
                value: arrCommand
                  .map((item) => `\`${item.command}\``)
                  .join(", "),
              },
              {
                name: "• Slash commands (" + commands.length + ")",
                value: commands.map((item) => `\`${item.name}\``).join(", "),
              },
              {
                name: `• ${E[3]}  (${
                  t.filter((item) => item.cat === "utilities").length
                })`,
                value: t
                  .filter((item) => item.cat === "utilities")
                  .map((item) => `\`${item.name}\``)
                  .join(", "),
              },
            ],
          },
        ],
      }).catch(async (error) => {
        console.log(error);
      });
    } else {
      const t = client.commands;
      const c = s[0].toLowerCase(),
        u =
          t.get(c) ||
          t.find((item) => item.aliases && item.aliases.includes(c));
      if (!u || u.cat === "owner" || u.owner) {
        if (c.startsWith("<")) {
          return this.extendersService.errorMessageMessage(
            "Hooks such as `[]` or `<>` must not be used when executing commands. Ex: `" +
              guildDB.prefix +
              "help music`",
            e
          );
        }
        const checkCat = await resolveCategory(c, client);
        if (checkCat) {
          const r = await this.extendersService.translateMessage(
              "HELP_LIENS_UTILES",
              guildDB.lang
            ),
            l = await this.extendersService.translateMessage(
              "CLIQ",
              guildDB.lang
            );
          return e.channel.send({
            embeds: [
              {
                // color: guildDB.color,
                title: checkCat.name,
                description: `${client.commands
                  .filter((item) => item.cat === checkCat.name.toLowerCase())
                  .map((item) => item.name)}`,
                fields: [
                  {
                    name: `• ${r[0]}`,
                    value: `[${l}](${this.clientConfig.linkwebsite})`,
                    inline: !0,
                  },
                  {
                    name: `• ${r[1]}`,
                    value: `[${l}](${this.clientConfig.linksupport})`,
                    inline: !0,
                  },
                  {
                    name: `• ${r[2]}`,
                    value: `[${l}](${this.clientConfig.linkinvite})`,
                    inline: !0,
                  },
                ],
                footer: {
                  text: "KOMU",
                  icon_url: e.client.user.displayAvatarURL({
                    // dynamic: !0,
                    size: 512,
                  }),
                },
              },
            ],
          });
        } else {
          const text = await this.extendersService.translateMessage(
            "HELP_ERROR",
            guildDB.lang
          );
          return this.extendersService.errorMessageMessage(
            text.replace("{text}", c),
            e
          );
        }
      }
      const E = await this.extendersService.ggMessage(u.description, e);
      return e.channel.send({
        embeds: [
          {
            // color: guildDB.color,
            title: u.name,
            description: `${E}`,
            fields: [
              {
                name: "• Aliases",
                value: `\`${
                  u.aliases
                    ? u.aliases.map((alias) => alias).join(", ") || "No aliases"
                    : "No aliases"
                }\``,
                inline: !0,
              },
              {
                name: "• Use",
                value: `\`${guildDB.prefix}${u.name} ${u.usage || ""}\``,
                inline: !0,
              },
            ],
            footer: {
              text: "KOMU",
              icon_url: e.client.user.displayAvatarURL({
                // dynamic: !0,
                size: 512,
              }),
            },
          },
        ],
      });
    }
  }
}
