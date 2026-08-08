const { Client } = require('discord.js-selfbot-v13');
const gradient = require('gradient-string');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const logo = `
  ██████╗ ██████╗  ██████╗ ██╗   ██╗██████╗ ██╗   ██╗ █████╗ ██╗  ██╗██╗   ██╗███████╗ █████╗
██╔════╝ ██╔══██╗██╔═══██╗██║   ██║██╔══██╗╚██╗ ██╔╝██╔══██╗██║ ██╔╝██║   ██║╚══███╔╝██╔══██╗
██║  ███╗██████╔╝██║   ██║██║   ██║██████╔╝ ╚████╔╝ ███████║█████╔╝ ██║   ██║  ███╔╝ ███████║
██║   ██║██╔══██╗██║   ██║██║   ██║██╔═══╝   ╚██╔╝  ██╔══██║██╔═██╗ ██║   ██║ ███╔╝  ██╔══██║
╚██████╔╝██║  ██║╚██████╔╝╚██████╔╝██║        ██║   ██║  ██║██║  ██╗╚██████╔╝███████╗██║  ██║
 ╚═════╝ ╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝        ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝

                         ⚔  G R O U P Y A K U Z A  ⚔
`;

function clear() {
  console.clear();
  console.log(gradient(['#ff0000', '#ff4500', '#ffa500', '#ffff00'])(logo));
  console.log(gradient(['#ff0000', '#ff4500'])(`                    [ GRoupYakuZa Cloner - Premium Edition ]`));
  console.log('');
}

function ask(question) {
  return new Promise(resolve => {
    rl.question(gradient(['#00ff00', '#00ff88'])(question), answer => {
      resolve(answer.trim());
    });
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retry(fn, maxRetries = 5, delay = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      console.log(gradient(['#ff0000', '#ff4500'])(`[!] Retry ${i + 1}/${maxRetries}...`));
      await sleep(delay);
    }
  }
}

async function cloneServer(client, sourceId, destId) {
  clear();

  try {
    const sourceGuild = await client.guilds.fetch(sourceId);
    const destGuild = await client.guilds.fetch(destId);

    console.log(gradient(['#00ff00', '#00ff88'])(`[+] Source: ${sourceGuild.name}`));
    console.log(gradient(['#00ff00', '#00ff88'])(`[+] Destination: ${destGuild.name}`));
    console.log('');

    // ====== PHASE 1: DELETE ALL CHANNELS ======
    console.log(gradient(['#ff4500', '#ffa500'])('[+] Phase 1: Deleting all channels...'));
    const destChannels = Array.from(destGuild.channels.cache.values());
    for (const channel of destChannels) {
      try {
        await retry(() => channel.delete(), 5, 1500);
        console.log(gradient(['#ff0000', '#ff4500'])(`[-] Deleted channel: ${channel.name}`));
      } catch (err) {
        console.log(gradient(['#ff0000', '#ff4500'])(`[!] Failed to delete channel: ${channel.name}`));
      }
      await sleep(500);
    }

    // ====== PHASE 2: DELETE ALL ROLES ======
    console.log('');
    console.log(gradient(['#ff4500', '#ffa500'])('[+] Phase 2: Deleting all roles...'));
    const destRoles = Array.from(destGuild.roles.cache.values())
      .filter(r => r.name !== '@everyone' && !r.managed);
    for (const role of destRoles) {
      try {
        await retry(() => role.delete(), 5, 1500);
        console.log(gradient(['#ff0000', '#ff4500'])(`[-] Deleted role: ${role.name}`));
      } catch (err) {
        console.log(gradient(['#ff0000', '#ff4500'])(`[!] Failed to delete role: ${role.name}`));
      }
      await sleep(500);
    }

    // Fetch full source data
    await sourceGuild.fetch();

    // ====== PHASE 3: CLONE ROLES ======
    console.log('');
    console.log(gradient(['#00ff00', '#00ff88'])('[+] Phase 3: Cloning roles...'));
    const sourceRoles = Array.from(sourceGuild.roles.cache.values())
      .filter(r => r.name !== '@everyone' && !r.managed)
      .sort((a, b) => b.position - a.position);

    const roleMap = new Map();
    for (const role of sourceRoles) {
      try {
        const newRole = await retry(() => destGuild.roles.create({
          name: role.name,
          color: role.color,
          hoist: role.hoist,
          mentionable: role.mentionable,
          permissions: role.permissions.bitfield,
          position: role.position
        }), 5, 1500);
        roleMap.set(role.id, newRole);
        console.log(gradient(['#00ff00', '#00ff88'])(`[+] Created role: ${role.name}`));
      } catch (err) {
        console.log(gradient(['#ff0000', '#ff4500'])(`[!] Failed to create role: ${role.name}`));
      }
      await sleep(500);
    }

    // ====== PHASE 4: CLONE CATEGORIES ======
    console.log('');
    console.log(gradient(['#00ff00', '#00ff88'])('[+] Phase 4: Cloning categories...'));

    const categories = sourceGuild.channels.cache.filter(c => c.type === 'GUILD_CATEGORY');
    const sortedCategories = Array.from(categories.values()).sort((a, b) => a.position - b.position);

    const channelMap = new Map();

    for (const category of sortedCategories) {
      try {
        const perms = category.permissionOverwrites
          ? Array.from(category.permissionOverwrites.cache.values()).map(perm => ({
              id: roleMap.get(perm.id)?.id || perm.id,
              allow: perm.allow ? perm.allow.bitfield.toString() : '0',
              deny: perm.deny ? perm.deny.bitfield.toString() : '0',
              type: perm.type
            }))
          : [];

        const newCategory = await retry(() => destGuild.channels.create(category.name, {
          type: 'GUILD_CATEGORY',
          position: category.position,
          permissionOverwrites: perms
        }), 5, 1500);

        channelMap.set(category.id, newCategory);
        console.log(gradient(['#00ff00', '#00ff88'])(`[+] Created category: ${category.name}`));
      } catch (err) {
        console.log(gradient(['#ff0000', '#ff4500'])(`[!] Failed to create category: ${category.name}`));
      }
      await sleep(500);
    }

    // ====== PHASE 5: CLONE CHANNELS ======
    console.log('');
    console.log(gradient(['#00ff00', '#00ff88'])('[+] Phase 5: Cloning channels...'));

    const others = sourceGuild.channels.cache.filter(c => c.type !== 'GUILD_CATEGORY');
    const sortedOthers = Array.from(others.values()).sort((a, b) => a.position - b.position);

    for (const channel of sortedOthers) {
      try {
        const parentId = channel.parentId ? channelMap.get(channel.parentId)?.id : null;

        const perms = channel.permissionOverwrites
          ? Array.from(channel.permissionOverwrites.cache.values()).map(perm => ({
              id: roleMap.get(perm.id)?.id || perm.id,
              allow: perm.allow ? perm.allow.bitfield.toString() : '0',
              deny: perm.deny ? perm.deny.bitfield.toString() : '0',
              type: perm.type
            }))
          : [];

        const newChannel = await retry(() => destGuild.channels.create(channel.name, {
          type: channel.type,
          topic: channel.topic || undefined,
          nsfw: channel.nsfw || false,
          bitrate: channel.bitrate || undefined,
          userLimit: channel.userLimit || undefined,
          rateLimitPerUser: channel.rateLimitPerUser || undefined,
          position: channel.position,
          parent: parentId,
          permissionOverwrites: perms
        }), 5, 1500);

        channelMap.set(channel.id, newChannel);
        console.log(gradient(['#00ff00', '#00ff88'])(`[+] Created channel: ${channel.name}`));
      } catch (err) {
        console.log(gradient(['#ff0000', '#ff4500'])(`[!] Failed to create channel: ${channel.name}`));
      }
      await sleep(500);
    }

    // ====== PHASE 6: CLONE WEBHOOKS (if any) ======
    console.log('');
    console.log(gradient(['#00ff00', '#00ff88'])('[+] Phase 6: Cloning webhooks...'));
    for (const [oldId, newChannel] of channelMap) {
      const oldChannel = sourceGuild.channels.cache.get(oldId);
      if (!oldChannel || !oldChannel.fetchWebhooks) continue;
      try {
        const webhooks = await oldChannel.fetchWebhooks();
        for (const webhook of webhooks.values()) {
          try {
            await retry(() => newChannel.createWebhook(webhook.name, {
              avatar: webhook.avatarURL(),
              reason: 'GRoupYakuZa Cloner'
            }), 3, 1000);
            console.log(gradient(['#00ff00', '#00ff88'])(`[+] Created webhook: ${webhook.name}`));
          } catch (err) {
            console.log(gradient(['#ff0000', '#ff4500'])(`[!] Failed webhook: ${webhook.name}`));
          }
        }
      } catch (err) {
        // No webhooks or no permission
      }
      await sleep(300);
    }

    // ====== DONE ======
    console.log('');
    console.log(gradient(['#00ff00', '#ffff00', '#ffa500'])(`[+] ============================================`));
    console.log(gradient(['#00ff00', '#ffff00', '#ffa500'])(`[+] Cloning completed successfully!`));
    console.log(gradient(['#00ff00', '#ffff00', '#ffa500'])(`[+] Powered by GRoupYakuZa`));
    console.log(gradient(['#00ff00', '#ffff00', '#ffa500'])(`[+] ============================================`));

  } catch (err) {
    console.log(gradient(['#ff0000', '#ff4500'])(`[!] Fatal Error: ${err.message}`));
  }

  rl.close();
  process.exit(0);
}

module.exports = { clear, ask, sleep, retry, cloneServer, rl };
