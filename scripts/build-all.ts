// Pulls, builds, and merges external site projects into ./dist for single-site deployment.
//
// Usage:
//   tsx scripts/build-all.ts                  # sync + build main site + all externals
//   tsx scripts/build-all.ts --skip-main      # skip main site build
//   tsx scripts/build-all.ts --skip-external  # skip external projects
//   tsx scripts/build-all.ts --clean          # delete dist/ and external/ before building

import { spawnSync, type SpawnSyncOptions } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

type Project = { name: string; repo: string; subpath: string };

const projects: Project[] = [
    { name: 'frank-stella-generative-art', repo: 'https://github.com/prichmp/frank-stella-generative-art.git', subpath: 'frank-stella-generative-art' },
    { name: 'reggie', repo: 'https://github.com/prichmp/reggie.git', subpath: 'reggie' },
    { name: 'diff-eq-generative-art', repo: 'https://github.com/prichmp/diff-eq-generative-art.git', subpath: 'diff-eq-generative-art' },
    { name: 'bauhaus-solar-system', repo: 'https://github.com/prichmp/bauhaus-solar-system.git', subpath: 'bauhaus-solar-system' },
];

const args = new Set(process.argv.slice(2));
const skipMain = args.has('--skip-main');
const skipExternal = args.has('--skip-external');
const clean = args.has('--clean');

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, '..');
const externalDir = join(root, 'external');
const distDir = join(root, 'dist');

function run(command: string, cmdArgs: string[], options: SpawnSyncOptions = {}): void {
    const result = spawnSync(command, cmdArgs, { stdio: 'inherit', shell: true, ...options });
    if (result.error) throw result.error;
    if (result.status !== 0) {
        const where = options.cwd ? ` in ${options.cwd}` : '';
        throw new Error(`${command} ${cmdArgs.join(' ')}${where} failed (exit ${result.status})`);
    }
}

function syncRepo(repo: string, target: string): void {
    if (existsSync(join(target, '.git'))) {
        console.log(`  pull: ${target}`);
        run('git', ['pull', '--ff-only'], { cwd: target });
        return;
    }
    if (existsSync(target)) throw new Error(`${target} exists but is not a git repo.`);
    const parent = dirname(target);
    if (!existsSync(parent)) mkdirSync(parent, { recursive: true });
    console.log(`  clone: ${repo}`);
    run('git', ['clone', repo, target]);
}

function installDeps(dir: string): void {
    console.log('  npm install');
    run('npm', ['install'], { cwd: dir });
}

function buildProject(dir: string, basePath: string): void {
    console.log(`  npm run build (base=${basePath})`);
    // Append --base to the underlying `vite build` via npm's `--` arg forwarding.
    run('npm', ['run', 'build', '--', `--base=${basePath}`], { cwd: dir });
}

function copyDist(from: string, to: string): void {
    if (!existsSync(from)) throw new Error(`Expected build output at ${from}`);
    if (existsSync(to)) rmSync(to, { recursive: true, force: true });
    mkdirSync(to, { recursive: true });
    cpSync(from, to, { recursive: true });
}

if (clean) {
    for (const p of [distDir, externalDir]) {
        if (existsSync(p)) {
            console.log(`Removing ${p}`);
            rmSync(p, { recursive: true, force: true });
        }
    }
}

if (!skipMain) {
    console.log('=== Main site ===');
    installDeps(root);
    buildProject(root, '/');
}

if (!skipExternal) {
    if (!existsSync(externalDir)) mkdirSync(externalDir, { recursive: true });
    if (!existsSync(distDir)) mkdirSync(distDir, { recursive: true });

    for (const proj of projects) {
        const target = join(externalDir, proj.name);
        const base = `/${proj.subpath}/`;
        const dest = join(distDir, proj.subpath);

        console.log('');
        console.log(`=== ${proj.name} -> ${base} ===`);

        syncRepo(proj.repo, target);
        installDeps(target);
        buildProject(target, base);
        copyDist(join(target, 'dist'), dest);
    }
}

console.log('');
console.log(`Done. Combined site: ${distDir}`);
