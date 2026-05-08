import { spawn } from "node:child_process";

export async function openPreviewUrl(url: string): Promise<void> {
  const command = platformCommand(url);

  await new Promise<void>((resolve, reject) => {
    const child = spawn(command.executable, command.args, {
      detached: true,
      stdio: "ignore"
    });

    child.once("error", reject);
    child.once("spawn", () => {
      child.unref();
      resolve();
    });
  });
}

function platformCommand(url: string): { executable: string; args: string[] } {
  if (process.platform === "win32") {
    return { executable: "cmd", args: ["/c", "start", "", url] };
  }

  if (process.platform === "darwin") {
    return { executable: "open", args: [url] };
  }

  return { executable: "xdg-open", args: [url] };
}