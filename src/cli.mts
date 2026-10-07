#!/usr/bin/env node
import { existsSync, symlinkSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, resolve } from "node:path";

type Options = {
  envPath: string;
  fetchCmd: string;
};

function parseArgs(): Options {
  const args = process.argv.slice(2);
  let envPath = ".env";
  let fetchCmd = "npm run -s env.fetch";

  for (let i = 0; i < args.length; i++) {
    const isEnvFlag = args[i] === "--env" || args[i] === "-e";
    const isCmdFlag = args[i] === "--cmd" || args[i] === "-c";
    const hasNext = args[i + 1] !== undefined;

    if (isEnvFlag && hasNext) {
      envPath = args[++i];
    } else if (isCmdFlag && hasNext) {
      fetchCmd = args[++i];
    }
  }

  return { envPath, fetchCmd };
}

const root = process.cwd();
const { envPath, fetchCmd } = parseArgs();
const env = resolve(root, envPath);

// 이미 있으면 스킵 — install 마다 시크릿을 다시 받아오는 걸 막는다.
if (existsSync(env)) process.exit(0);

// 워크트리면 main repo 의 동일 경로 파일을 심링크로 재사용한다.
// git-common-dir 은 워크트리에서도 main 의 .git 을 가리키므로 그 부모가 main repo root.
// 복사 대신 심링크라 main 파일이 갱신되면 워크트리도 즉시 최신 상태가 된다.
// ⚠️ 워크트리 파일이 심링크라, 여기에 쓰는 동작은 main 파일로 역전파된다.
try {
  const common = execSync("git rev-parse --path-format=absolute --git-common-dir", {
    cwd: root,
  })
    .toString()
    .trim();
  const mainEnv = resolve(dirname(common), envPath);
  // main repo 자신이면 두 경로가 같아져 이 분기를 건너뛰고 아래 fetch 로 간다.
  const isWorktree = mainEnv !== env;
  const canSymlink = isWorktree && existsSync(mainEnv);
  if (canSymlink) {
    symlinkSync(mainEnv, env);
    console.log(`[env-worktree-sync] symlinked ${mainEnv}`);
    process.exit(0);
  }
} catch {}

// 재사용할 파일이 없을 때만 fetchCmd 로 새로 생성한다.
execSync(fetchCmd, { cwd: root, stdio: "inherit" });
