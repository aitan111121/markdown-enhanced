import { execFile, spawn } from "node:child_process";
import { mkdtemp, rm, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const npmCommand = process.platform === "win32" ? "cmd.exe" : "npm";
const processOptions = process.platform === "win32" ? { windowsHide: true } : {};
let tarballPath;
let tempRoot;

try {
  const packOutput = await exec(npmCommand, npmArgs(["pack", "--json"]), { cwd: repoRoot });
  const [packResult] = JSON.parse(packOutput.stdout);
  tarballPath = path.join(repoRoot, packResult.filename);
  tempRoot = await mkdtemp(path.join(tmpdir(), "zed-mpe-release-smoke-"));

  await writeFile(path.join(tempRoot, "package.json"), JSON.stringify({ private: true }, null, 2));
  await writeFile(path.join(tempRoot, "README.md"), "# Smoke\n\nPackage smoke test.\n");
  await exec(npmCommand, npmArgs(["install", "--omit=dev", tarballPath]), { cwd: tempRoot, timeout: 120000 });

  const child = spawn(npmCommand, npmArgs([
    "exec",
    "--",
    "zed-mpe",
    "preview",
    "--workspace",
    tempRoot,
    "--file",
    path.join(tempRoot, "README.md"),
    "--port",
    "0",
    "--no-open",
    "--save-mode",
    "filesystem"
  ]), { cwd: tempRoot, stdio: ["ignore", "pipe", "pipe"], ...processOptions });

  try {
    const healthUrl = await waitForHealthUrl(child);
    const { response, body } = await fetchHealthWithRetry(healthUrl);

    if (!response.ok || body.service !== "zed-mpe-preview") {
      throw new Error(`Unexpected health response: ${response.status} ${JSON.stringify(body)}`);
    }
  } finally {
    await stopChild(child);
  }

  console.log("[zed-mpe] package smoke passed");
} finally {
  if (tempRoot) {
    await removeTempRoot(tempRoot);
  }

  if (tarballPath) {
    await unlink(tarballPath).catch(() => undefined);
  }
}

function exec(command, args, options) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { ...options, ...processOptions }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`${command} ${args.join(" ")} failed\n${stdout}\n${stderr}`));
        return;
      }

      resolve({ stdout, stderr });
    });
  });
}

function npmArgs(args) {
  return process.platform === "win32" ? ["/d", "/s", "/c", "npm", ...args] : args;
}

async function fetchHealthWithRetry(healthUrl) {
  let lastError;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      const response = await fetch(healthUrl);
      const body = await response.json();
      return { response, body };
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  throw lastError;
}

async function stopChild(child) {
  if (child.exitCode !== null) {
    return;
  }

  if (process.platform === "win32" && child.pid) {
    await new Promise((resolve) => {
      execFile("taskkill.exe", ["/pid", String(child.pid), "/t", "/f"], { windowsHide: true }, () => resolve());
    });
  } else {
    child.kill();
  }

  await new Promise((resolve) => {
    const timer = setTimeout(resolve, 3000);
    child.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

async function removeTempRoot(root) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await rm(root, { recursive: true, force: true });
      return;
    } catch (error) {
      if (attempt === 4) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
}

function waitForHealthUrl(child) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Timed out waiting for health URL"));
    }, 15000);

    const onData = (data) => {
      const text = data.toString();
      const match = text.match(/health (http:\/\/127\.0\.0\.1:\d+\/health)/);
      if (match) {
        clearTimeout(timer);
        resolve(match[1]);
      }
    };

    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("exit", (code) => {
      if (code !== null && code !== 0) {
        clearTimeout(timer);
        reject(new Error(`Preview command exited early with code ${code}`));
      }
    });
  });
}