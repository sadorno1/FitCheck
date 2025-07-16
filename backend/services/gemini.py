import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv
load_dotenv()

# Configure Gemini
genai.api_key = os.getenv('GENAI_API_KEY')
client = genai.Client(api_key=genai.api_key)

def ai_parse_resume_with_gemini(resume_text):
    prompt = f"""
You are a resume parser. Given the following resume text, output ONLY text that is in the form of valid JSON **do not include markdown back-ticks actual json format, just normal text that would be valid as json. also dont include newline symbols
- education: string
- experience: string
- skills: string
- projects: string
Resume text:
{resume_text}
"""
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        config=types.GenerateContentConfig(temperature=0.0),
        contents=prompt
    )
    return json.loads(response.text)