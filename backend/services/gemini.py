# ---- config ----
import os, json, difflib, datetime, hashlib, requests, google.generativeai as genai
from dotenv import load_dotenv
import random
load_dotenv()
genai.configure(api_key=os.getenv("GENAI_API_KEY"))

ALLOWED_TYPES      = ["shirt", "dress", "pants", "jeans", "shorts", "blazer", "jacket"]
ALLOWED_COLORS     = ["black", "white", "gray", "red", "orange", "yellow",
                      "green", "cyan", "blue", "purple"]
ALLOWED_ETIQUETTES = ["casual", "formal", "business"]

def _closest(word, choices):
    if not word:
        return choices[0]
    return difflib.get_close_matches(word.lower(), choices, n=1, cutoff=0.0)[0]

# ---- Gemini vision tagging --------------------------------------------------
def gemini_tag_image(image_url):
    img_bytes = requests.get(image_url).content
    img_part  = {"mime_type": "image/jpeg", "data": img_bytes}

    prompt = (
        "Classify this garment photo and reply ONLY with valid JSON. DO NOT USE BACKTICKS, DO NOT USE MARKDOWN, i literally want valid json\n"
        f'"type": one of {ALLOWED_TYPES}\n'
        f'"etiquette": one of {ALLOWED_ETIQUETTES}\n'
        f'"color": one of {ALLOWED_COLORS}\n'
        '"description": ≤ 20‑word style sentence.\n'
        "Map close synonyms (e.g., trousers→pants, olive→green)."
    )

    model = genai.GenerativeModel("gemini-2.5-flash")  
    resp  = model.generate_content(
        contents=[img_part, prompt],
        generation_config={"temperature": 0.2}
    )  
    data = json.loads(resp.text)

    return {
        "type":       _closest(data.get("type"), ALLOWED_TYPES),
        "etiquette":  _closest(data.get("etiquette"), ALLOWED_ETIQUETTES),
        "color":      _closest(data.get("color"), ALLOWED_COLORS),
        "description": str(data.get("description", "")).strip()[:160]
    }

def generate_ootd(style_keywords, closet_items):

    # -- compress closet to avoid token bloat -------------------------------
    mini_closet = [
        { "id": c["id"], "type": c["type"], "color": c["color"],
          "etiquette": c["etiquette"], "description": c["description"] }
        for c in closet_items
    ]

    # -- deterministic daily seed so user doesn’t get same outfit ----------
    daily_seed = random.randint(0, 10**8)

    # -- prompt -------------------------------------------------------------
    prompt = (
        f"You are a fashion stylist.\n"
        f"STYLE WORDS: {style_keywords}\n\n"
        f"CLOSET (JSON array): {json.dumps(mini_closet)}\n\n"
        "Goal: choose either (1) one dress, OR (2) one top/shirt/blazer/jacket and one bottom/pants/shorts/jeans, that "
        "try to match the style words (color palette, vibe, etiquette), but prioritize randomness, like pls dont give me the same outfit when i call again\n"
        "Respond with **ONLY** a JSON array of IDs in this exact order:\n"
        "• If you choose a dress → [dress_id]\n"
        "• If you choose top+bottom → [top_id, bottom_id] (TOP FIRST!)\n"
        "No markdown, no keys, no extra text—just the JSON array.\n"
        f"SEED: {daily_seed}"
    )

    model   = genai.GenerativeModel("gemini-2.5-flash")
    generation_config={
            "temperature": 0.8,
            "candidate_count": 3,     
            "response_mime_type": "application/json"
        }
    

    resp = model.generate_content(prompt, generation_config=generation_config)

    valid = []
    for c in resp.candidates:
        try:
            ids = json.loads(c.content.parts[0].text)
            if isinstance(ids, list) and 1 <= len(ids) <= 2 and all(isinstance(i, int) for i in ids):
                valid.append(ids)
        except json.JSONDecodeError:
            pass

    if not valid:
        raise RuntimeError("No valid outfits returned")

    return random.choice(valid) 

    # ---------- fallback: simplest match if model misbehaves --------------
    # find first dress or first top+bottom
    dress = next((c["id"] for c in closet_items if c["type"] == "dress"), None)
    if dress:
        return [dress]

    top    = next((c["id"] for c in closet_items if c["type"] in ("shirt", "top")), None)
    bottom = next((c["id"] for c in closet_items if c["type"] in ("pants", "jeans", "shorts")), None)
    return [top, bottom] if top and bottom else []