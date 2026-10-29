"""Build public/: the exact file set Firebase Hosting serves. No customer data.
Run from the Matrix folder: python3 tools/build-public.py
Regenerate after changing any runtime file (index.html, app.js, styles.css, migrate-v12.js,
matrix-cloud.js, firebase-config.js, sw.js, manifest.webmanifest, icons/, logo.svg)
or after re-seeding. public/ is committed; tests/hosting-public-test.js fails if it is stale.
The full seed-data.js (customer names, emails, phones, deal values) stays at the repo root for
tests and local (file:// or python3 -m http.server) use only. public/seed-data.js keeps only the
menu structure: areas, sections, stages, stageLabels, with tasks and deals emptied out."""
import datetime, json, os, shutil, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(ROOT, 'public')

RUNTIME_FILES = [
    'index.html', 'app.js', 'styles.css', 'migrate-v12.js', 'matrix-cloud.js',
    'firebase-config.js', 'sw.js', 'manifest.webmanifest', 'logo.svg',
]
RUNTIME_DIRS = ['icons']
STRUCTURE_KEYS = ['version', 'areas', 'sections', 'stages', 'stageLabels']


def build_public_seed():
    src = open(os.path.join(ROOT, 'seed-data.js'), encoding='utf-8').read()
    full = json.loads(src[src.index('=') + 1:].strip().rstrip(';'))
    structural = {k: full[k] for k in STRUCTURE_KEYS if k in full}
    structural['tasks'] = []
    structural['deals'] = []
    return ('/* Hosting seed: menu structure only, no customer data. Full seed at the repo root,\n'
            '   used for tests and local (file:// or http.server) runs. Regenerate this file with\n'
            '   tools/build-public.py, never edit it by hand. */\n'
            'window.MATRIX_SEED = ' + json.dumps(structural, indent=1) + ';\n')


def stamp_build():
    """Deploy time only (firebase.json predeploy passes --stamp): write the git commit and time into
    public/firebase-config.js so Admin tools can show what is live. The committed public/ is never stamped."""
    try:
        commit = subprocess.check_output(['git', 'rev-parse', '--short', 'HEAD'], cwd=ROOT).decode().strip()
    except Exception:
        commit = 'unknown'
    built = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    path = os.path.join(PUBLIC, 'firebase-config.js')
    src = open(path, encoding='utf-8').read()
    old = 'window.MATRIX_BUILD = { commit: "dev", builtAt: "" };'
    if old not in src:
        raise SystemExit('stamp: MATRIX_BUILD line not found in firebase-config.js')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(src.replace(old, 'window.MATRIX_BUILD = { commit: "%s", builtAt: "%s" };' % (commit, built)))
    print('stamped', commit, built)


def main():
    if os.path.isdir(PUBLIC):
        shutil.rmtree(PUBLIC)
    os.makedirs(PUBLIC)
    for name in RUNTIME_FILES:
        shutil.copy2(os.path.join(ROOT, name), os.path.join(PUBLIC, name))
    for d in RUNTIME_DIRS:
        shutil.copytree(os.path.join(ROOT, d), os.path.join(PUBLIC, d))
    with open(os.path.join(PUBLIC, 'seed-data.js'), 'w', encoding='utf-8') as f:
        f.write(build_public_seed())
    print('wrote', PUBLIC)
    if '--stamp' in sys.argv:
        stamp_build()


if __name__ == '__main__':
    main()
