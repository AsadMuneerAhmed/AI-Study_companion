import os
import json
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def generate_study_plan(topic: str, chunks: list[str]) -> dict:
    context = "\n\n".join(chunks)

    prompt = f"""You are a study assistant. Based ONLY on the notes below, create a detailed study plan for the topic: "{topic}"

Notes:
{context}

Answer exactly what the topic asks. If the topic names a specific aspect of a subject (for example limitations, types, advantages or steps), start the summary directly with that aspect. Do not begin with a general definition or introduction of the wider subject unless the topic asks for it. Write the summary in at least 4-5 sentences, using only facts that are in the notes. Make the key points and study steps focus on the same aspect.
Use the exact terms, definitions and wording from the notes wherever possible. Do not replace the notes' terminology with synonyms or your own phrasing. State definitions the way the notes state them.
Include at least 5 key points and at least 5 study steps, going into good detail.

Return ONLY valid JSON (no markdown, no extra text) in this exact format:
{{
  "topic": "{topic}",
  "summary": "a detailed, well-explained summary of the topic",
  "key_points": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "study_steps": ["step 1", "step 2", "step 3", "step 4", "step 5"]
}}
"""

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[{"role": "user", "content": prompt}]
    )

    text = response.choices[0].message.content.strip()

    if text.startswith("```"):
        text = text.strip("`")
        text = text.replace("json", "", 1).strip()

    return json.loads(text)