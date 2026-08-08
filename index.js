const { Client } = require('discord.js-selfbot-v13');
const gradient = require('gradient-string');
const { clear, ask, cloneServer, rl } = require('./cloner');

const logo = `
 ██████╗ ██████╗  ██████╗ ██╗   ██╗██████╗ ██╗   ██╗ █████╗ ██╗  ██╗██╗   ██╗███████╗ █████╗  
██╔════╝ ██╔══██╗██╔═══██╗██║   ██║██╔══██╗╚██╗ ██╔╝██╔══██╗██║ ██╔╝██║   ██║╚══███╔╝██╔══██╗  
██║  ███╗██████╔╝██║   ██║██║   ██║██████╔╝ ╚████╔╝ ███████║█████╔╝ ██║   ██║  ███╔╝ ███████║  
██║   ██║██╔══██╗██║   ██║██║   ██║██╔═══╝   ╚██╔╝  ██╔══██║██╔═██╗ ██║   ██║ ███╔╝  ██╔══██║  
╚██████╔╝██║  ██║╚██████╔╝╚██████╔╝██║        ██║   ██║  ██║██║  ██╗╚██████╔╝███████╗██║  ██║  
 ╚═════╝ ╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝        ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝  
`;

function showBanner() {
  console.clear();
  console.log(gradient(['#ff0000', '#ff4500', '#ffa500', '#ffff00'])(logo));
  console.log(gradient(['#ff0000', '#ff4500'])(`                         ⚔  G R O U P Y A K U Z A  ⚔`));
  console.log(gradient(['#ff0000', '#ff4500'])(`                    [ GRoupYakuZa Cloner - Premium Edition ]`));
  console.log('');
}

async function main() {
  showBanner();

  const token = await ask('[?] Put your Discord Token: ');

  const client = new Client({ checkUpdate: false });

  client.on('ready', async () => {
    showBanner();
    console.log(gradient(['#00ff00', '#00ff88'])(`[+] Logged in as: ${client.user.tag}`));
    console.log('');

    const sourceId = await ask('[?] Put Server ID you need to clone: ');
    const destId = await ask('[?] Put Server ID to clone in: ');

    const confirm = await ask('[?] Start cloning? (y/n): ');
    if (confirm.toLowerCase() !== 'y') {
      console.log(gradient(['#ff0000', '#ff4500'])('[!] Cancelled.'));
      rl.close();
      process.exit(0);
    }

    await cloneServer(client, sourceId, destId);
  });

  client.login(token).catch(err => {
    showBanner();
    console.log(gradient(['#ff0000', '#ff4500'])(`[!] Invalid Token - Please check your token and try again.`));
    rl.close();
    process.exit(1);
  });
}

main();
