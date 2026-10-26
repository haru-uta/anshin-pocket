#!/bin/bash
# モリーの気持ちの表情シート（2列×3段）を GPT に2案描かせる
cd "$(dirname "$0")/.."
P='$imagegen Draw ONE character sheet image: 6 panels in a 2-column x 3-row grid, same size each, plain pure white background, no text, no panel borders, no ground shadows, no motion lines. The dog is exactly the dog in the reference image (miniature schnauzer, salt-and-pepper slightly dark coat, long fluffy drooping ears, eyebrows and beard, pale mint-green bandana), same style: black brush-pen lines with light watercolor. Each panel shows the whole dog, facing the viewer at three-quarter view, centered and fully inside its panel. The emotions must be very clear and exaggerated through BODY LANGUAGE (ears, tail, posture, eyes, mouth) so a young child can tell them apart: 1 (top-left) HAPPY: mouth open smiling, tail up and wagging, ears relaxed, bouncy posture. 2 (top-right) SCARED: ears flat back, tail tucked between legs, body crouched low, eyes wide, leaning away. 3 (middle-left) DISLIKES IT / NO THANK YOU: head turned away, one paw raised as if pushing away, ears slightly back, mouth closed tight. 4 (middle-right) SAD: head low, ears drooping down, tail down, eyes looking down, small sigh. 5 (bottom-left) SURPRISED: eyes very round, ears up, mouth small O, body slightly jumped back. 6 (bottom-right) CALM / RELAXED: lying down comfortably, eyes half closed, gentle smile. Gentle and kind, never scary. Save it as a PNG.'
for n in 1 2; do
  printf '%s\n' "$P" | codex exec --skip-git-repo-check -s read-only -i art/ref_molly_hello.png - > art/raw/emo_$n.log 2>&1 &
done
wait
grep -h "session id" art/raw/emo_*.log
