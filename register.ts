const url = `https://discord.com/api/v10/applications/${process.env.DISCORD_CLIENT_ID}/role-connections/metadata`;
const body = [
  {
    key: "linked",
    name: "アカウント接続",
    description: "INIADアカウントと接続されているか",
    type: 7,
  },
];

const main = async () => {
  const response = await fetch(url, {
    method: "PUT",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
    },
  });
  if (response.ok) {
    const data = await response.json();
    // biome-ignore lint/suspicious/noConsoleLog:
    console.log(data);
  } else {
    //throw new Error(`Error pushing discord metadata schema: [${response.status}] ${response.statusText}`);
    const data = await response.text();
    console.error(data);
  }
};

main();
