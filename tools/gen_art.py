"""残りの絵を GPT（Codex 経由・ChatGPT 契約内）に描かせて art/raw/<名前>.png に置く。
使い方: python tools/gen_art.py [名前 ...]   （なしで まだ無い物を全部）
"""
import concurrent.futures as cf
import pathlib, re, shutil, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW = ROOT / 'art' / 'raw'
GEN = pathlib.Path.home() / '.codex' / 'generated_images'
STYLE = ('Style exactly like the reference image: black brush-pen lines with light soft watercolor, gentle and kind, '
         'never scary. Plain pure white background. No text, no letters, no numbers anywhere.')
DOG = ('Draw ONE character sheet: 6 panels in a 2-column x 3-row grid with the SAME 6 poses and emotions, in the same order, '
       'as the reference sheet (happy, scared, dislikes it, sad, surprised, calm). Whole dog in each panel, fully inside it, '
       'wide white gaps between panels, no panel borders, no ground shadows, no motion lines. The dog is {d}. ' + STYLE)
CHILD = ('the same child in every panel: about 7 years old, short dark hair, yellow T-shirt and navy shorts, gender-neutral')
SCENE = ('Draw ONE image: 6 separate vignette illustrations in a 2-column x 3-row grid, each vignette a rounded rectangle '
         'with its own soft pale background, wide pure white gutters between them, all the same size. ' + CHILD + '. '
         'Calm, reassuring, realistic for Japan. Panels in order (left to right, top to bottom): {p} ' + STYLE)
ICONS = ('Draw ONE image: a {g} grid of {n} small separate icons, each a simple single object or scene centered in its cell, '
         'wide pure white gutters, no borders, no frames. Thick soft black brush-pen outline with light watercolor fill, '
         'cute, simple, instantly recognizable by a young child. Icons in order (left to right, top to bottom): {p} ' + STYLE)

JOBS = {
    'hero': ('ref', 'Draw ONE wide illustration (16:9) for the top of a picture-book app title screen for children: a gentle watercolor scene of '
        'a sunny meadow with soft rolling hills, a few round trees and small flowers, pale blue sky with soft clouds. In the center foreground '
        'the dog from the reference (miniature schnauzer, salt-and-pepper, mint bandana) sits happily with three puppy friends: a red-orange Shiba Inu '
        'with coral bandana, a cream Toy Poodle with pink bandana and a chocolate long-haired Dachshund with yellow bandana. Leave the upper third '
        'mostly empty sky (a title will be placed there). The bottom edge fades softly into warm cream (#fbf6ec). No text, no letters. '
        'Black brush-pen lines with soft watercolor, premium picture-book quality.'),
    'tile_emotions': ('ref', "Draw ONE square illustration (1:1) for a menu button of a children's picture-book app: a soft watercolor vignette that fades into a plain warm cream (#fbf6ec) background at the edges, no hard border, no frame, no text. Black brush-pen lines with soft watercolor, gentle, high quality picture-book art, the subject large and centered. Subject: the dog from the reference sitting and smiling, with four small round speech-bubble cards floating around it, each showing a simple dog face with a different expression (happy, surprised, sad, calm)."),
    'tile_practice': ('ref', "Draw ONE square illustration (1:1) for a menu button of a children's picture-book app: a soft watercolor vignette that fades into a plain warm cream (#fbf6ec) background at the edges, no hard border, no frame, no text. Black brush-pen lines with soft watercolor, gentle, high quality picture-book art, the subject large and centered. Subject: a 7-year-old child with short dark hair in a yellow T-shirt walking hand in hand along a little path with the dog from the reference, toward a small friendly clinic building and a signpost, a backpack on the child."),
    'tile_note': ('ref', "Draw ONE square illustration (1:1) for a menu button of a children's picture-book app: a soft watercolor vignette that fades into a plain warm cream (#fbf6ec) background at the edges, no hard border, no frame, no text. Black brush-pen lines with soft watercolor, gentle, high quality picture-book art, the subject large and centered. Subject: an open notebook with a child's smiling portrait drawn on the left page, colorful stickers (a star, a heart, a rainbow) and crayons around it, the dog from the reference peeking from behind the notebook."),
    'tile_plan': ('ref', "Draw ONE square illustration (1:1) for a menu button of a children's picture-book app: a soft watercolor vignette that fades into a plain warm cream (#fbf6ec) background at the edges, no hard border, no frame, no text. Black brush-pen lines with soft watercolor, gentle, high quality picture-book art, the subject large and centered. Subject: a row of three picture cards pinned on a small string like a timeline (a sun, a school, a moon), with a round friendly clock, and the dog from the reference pointing at the first card with its paw."),
    'tile_shop': ('ref', "Draw ONE square illustration (1:1) for a menu button of a children's picture-book app: a soft watercolor vignette that fades into a plain warm cream (#fbf6ec) background at the edges, no hard border, no frame, no text. Black brush-pen lines with soft watercolor, gentle, high quality picture-book art, the subject large and centered. Subject: a tiny cozy shop stall with a striped mint and cream awning, jars of colorful stickers and ribbons on the counter, the dog from the reference standing behind the counter smiling."),
    'app_icon': ('ref', 'Draw ONE square app icon illustration (1024x1024), filling the whole square edge to edge: a warm soft yellow background; '
        'in the center a big soft mint-green fabric pocket with visible white stitching, and the dog from the reference (miniature schnauzer, '
        'salt-and-pepper coat, mint bandana) happily peeking out of the pocket showing its head and front paws, big friendly face, '
        'a small pink heart floating above. Bold clear shapes and strong dark outlines so it is recognizable at very small sizes on a phone '
        'home screen. Black brush-pen lines with soft watercolor. No text, no letters, no rounded corners, no border.'),
    'dog_shiba': ('ref_sheet', DOG.format(d='a Shiba Inu with red-orange and cream coat, curled tail, wearing a pale coral bandana')),
    'dog_poodle': ('ref_sheet', DOG.format(d='a cream-colored Toy Poodle with curly fur, wearing a pale pink bandana')),
    'dog_dachs': ('ref_sheet', DOG.format(d='a chocolate-and-tan Miniature Dachshund with long ears, wearing a pale yellow bandana')),
    'scene_hospital': ('ref', SCENE.format(p='1 a parent hands a card at a clinic reception desk, the child stands beside; '
        '2 the child sits in a waiting room holding a small plush toy; 3 a nurse at a door calls, the child raises a hand; '
        '4 the child enters a doctor\'s exam room and bows to a kind doctor; 5 the doctor listens to the child\'s chest with a stethoscope; '
        '6 the child waves goodbye leaving the exam room with the parent.')),
    'scene_shot': ('ref', SCENE.format(p='1 the child sits on a chair and holds out an arm on a small cushion, a nurse beside; '
        '2 a nurse wraps a soft rubber band around the child\'s upper arm; 3 the nurse wipes the arm with a cotton swab; '
        '4 the child looks away at a parent and counts on fingers while the nurse gives a quick shot (needle small, not scary, no blood); '
        '5 the nurse puts a round bandage on the arm; 6 the child smiles proudly with the bandage, parent gives a thumbs up.')),
    'scene_dentist': ('ref', SCENE.format(p='1 the child waits in a dental clinic waiting room; 2 the child sits in a dental chair that is reclining; '
        '3 a bright lamp above, the child closes eyes calmly; 4 the child opens mouth wide, a kind dentist looks with a small mirror; '
        '5 the dentist uses a small water tool, the child raises a hand as a signal; 6 the child rinses with a cup of water and smiles.')),
    'scene_haircut': ('ref', SCENE.format(p='1 the child sits in a barber chair facing a mirror; 2 a barber puts a cape around the child\'s neck; '
        '3 the barber sprays water on the hair with a spray bottle, the child closes eyes; 4 the barber cuts hair with scissors; '
        '5 the barber uses electric clippers near the neck, the child giggles; 6 the child looks in the mirror with a neat haircut.')),
    'scene_newplace': ('ref', SCENE.format(p='1 the child and a parent look at photos of a school on a tablet at home; '
        '2 the child and parent arrive at a school entrance gate; 3 a busy school gym with many people, the child wears ear muffs; '
        '4 the child finds a chair with a name tag in a row; 5 the child rests on a bench in a quiet corner with a parent; '
        '6 the child and parent walk home holding hands at sunset.')),
    'scene_visit': ('ref', SCENE.format(p='1 a front door of a Japanese house with an intercom button being pressed; '
        '2 the child waves hello to a friendly visiting nurse in a light green polo shirt at the door; '
        '3 the nurse washes hands at a sink; 4 the nurse measures the child\'s blood pressure with a soft cuff on the arm at a table; '
        '5 the nurse and child play with building blocks on the floor; 6 the child waves goodbye at the door as the nurse leaves.')),
    'icons_plan': ('ref', ICONS.format(g='4x4', n=16, p='sunrise (waking up), a T-shirt (getting dressed), a bowl of rice (meal), '
        'a toothbrush, a toilet, a school building, puzzle pieces (play), a cookie (snack), a sneaker footprint path (walk), '
        'a shopping cart, a pencil and notebook (homework), a medicine packet and pill, a stethoscope, a hospital building, '
        'a bathtub with bubbles, a crescent moon and pillow (sleep).')),
    'icons_card': ('ref', ICONS.format(g='4x4', n=16, p='a loudspeaker with sound waves (loud noise), a very bright light bulb with rays, '
        'a crowd of many small people, a hand reaching to touch a shoulder, a nose with wavy smell lines, a calendar with a swap arrow (plans change), '
        'an hourglass (long wait), an unfamiliar door, '
        'a quiet room with a soft lamp, ear muffs, a child breathing out slowly with a soft breeze, a hug of a teddy bear, '
        'a clipboard checklist (told in advance), a picture card, a small chair to rest, fingers counting 1 2 3 shown as dots.')),
    'icons_food': ('ref', ICONS.format(g='4x4', n=16, p='curry rice, ramen, sushi, a rice ball (onigiri), fried chicken (karaage), a hamburger steak, '
        'spaghetti, udon, a strawberry, a banana, an apple, ice cream, a pudding, a chocolate bar, a slice of pizza, fried egg on rice.')),
    'icons_play': ('ref', ICONS.format(g='4x4', n=16, p='building blocks, a picture book, crayons drawing, a ball, a toy train, a game controller, '
        'a swing, a slide, a toy car, a puzzle, a music note with a small keyboard, dancing shoes, a bicycle, a paper airplane, '
        'clay modeling, a magnifying glass looking at a bug.')),
    'icons_sticker': ('ref', ICONS.format(g='4x4', n=16, p='a smiling star, a heart, a rainbow, a four-leaf clover, a smiling sun, a crescent moon, '
        'a cupcake, a balloon, a crown, a dog paw print, a bone, a flower, a butterfly, a rocket, a whale, a trophy.')),
    'avatars': ('ref', 'Draw ONE image: a 4-column x 3-row grid of 12 separate friendly child portraits (head and shoulders, facing the viewer, smiling gently), '
        'about 6 to 10 years old, wide pure white gutters, no borders. Make them clearly different from each other: varied hairstyles '
        '(short, long, ponytail, buzz cut, curly, bob, braids, glasses on some), varied skin tones and hair colors, gender-diverse, '
        'each wearing a plain T-shirt of a different soft color. ' + STYLE),
}
REFS = {'ref': ROOT / 'art' / 'ref_molly_hello.png', 'ref_sheet': RAW / 'emo_sheet_1.png'}


def run(name):
    ref, prompt = JOBS[name]
    log = RAW / f'{name}.log'
    for attempt in range(2):
        with open(log, 'w', encoding='utf-8') as f:
            subprocess.run(['codex', 'exec', '--skip-git-repo-check', '-s', 'read-only', '-i', str(REFS[ref]), '-'],
                           input='$imagegen ' + prompt + ' Save it as a PNG.', text=True, encoding='utf-8',
                           stdout=f, stderr=subprocess.STDOUT, shell=(sys.platform == 'win32'))
        text = log.read_text(encoding='utf-8', errors='replace')
        m = re.search(r'session id: (\S+)', text)
        pngs = sorted((GEN / m.group(1)).glob('*.png'), key=lambda p: p.stat().st_mtime) if m else []
        if pngs:
            for i, p in enumerate(pngs):
                shutil.copy(p, RAW / (f'{name}.png' if i == 0 else f'{name}_{i + 1}.png'))
            return f'{name}: ok ({len(pngs)})'
        if 'usage_limit' in text or 'usage limit' in text:
            return f'{name}: usage limit'
    return f'{name}: failed'


if __name__ == '__main__':
    names = sys.argv[1:] or [n for n in JOBS if not (RAW / f'{n}.png').exists()]
    with cf.ThreadPoolExecutor(3) as ex:
        for r in ex.map(run, names):
            print(r, flush=True)
