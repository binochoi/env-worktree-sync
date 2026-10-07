# env-worktree-sync

A zero-dependency CLI that makes sure your `.env` file exists before you run anything. If the file is already there, it does nothing. Inside a **git worktree**, it **symlinks** the `.env` from the main repository, so new worktrees (including ones created by AI coding agents like Claude Code or Cursor) get your secrets right away. Otherwise it runs your own command to generate the file, using a secret manager such as **Doppler, 1Password CLI, Infisical or HashiCorp Vault**. Put it in a `prepare` or `postinstall` script and your dotenv setup takes care of itself in every clone, worktree and monorepo package.

- **Skips when the file exists**, so `pnpm install` / `npm install` doesn't re-fetch secrets every time
- **Shares one `.env` across git worktrees** with a symlink, not a copy, so worktrees never hold stale secrets
- **Generates the file on demand** with any shell command you choose

## Use cases

- **Parallel git worktrees**: work on several branches at once without copying `.env` by hand into each worktree.
- **Secret manager bootstrap**: fetch secrets from Doppler, 1Password, Infisical or Vault only on the first install.
- **AI coding agents and CI**: tools that spin up fresh worktrees start with a working environment and need no manual setup.

## Install

```sh
npm install env-worktree-sync
```

## Usage

```sh
env-worktree-sync [options]
```

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `--env`, `-e` | `.env` | Target env file path (relative to the current directory, or absolute) |
| `--cmd`, `-c` | `npm run -s env.fetch` | Command to run when the env file is missing |

### Examples

```sh
# Defaults (expects an `env.fetch` script in package.json)
env-worktree-sync

# Different file name
env-worktree-sync --env .env.local

# Doppler
env-worktree-sync --cmd "doppler secrets download --no-file --format env > .env"

# 1Password CLI
env-worktree-sync --cmd "op inject -i .env.tpl -o .env"

# Infisical
env-worktree-sync --cmd "infisical export --format=dotenv > .env"
```

Run it automatically after every install:

```json
{
  "scripts": {
    "prepare": "env-worktree-sync --cmd 'doppler secrets download --no-file --format env > .env'"
  }
}
```

## How it works

1. If the file given by `--env` exists, exit right away (exit code 0).
2. If the current directory is a git worktree and the main repository has a file at the same path, create a symlink to it and exit.
3. Otherwise, run the `--cmd` command.

Notes:

- In step 2, the `--env` path is resolved against the main repository's root, so run `env-worktree-sync` from the root of the worktree.
- Because the worktree file is a symlink, writing to it also changes the main repository's file.

## License

MIT
