# Testing

This list is for testing the main features of the project. Check the expected result after each test.

## Setup before testing

1. Start the backend: `python -m uvicorn main:app --reload --port 8000` (inside the backend folder, with the venv active).
2. Start the frontend: `npm run dev` (inside the frontend folder).
3. Create the Qdrant collection once: in Swagger, run `/setup-collection` with Execute.
4. Upload test notes: in `/store-document`, upload one notes file (doc_type `notes`) and one past paper (doc_type `past_paper`).

## Test cases

| # | Feature | Input | Expected result |
|---|---|---|---|
| 1 | Upload notes | Notes file (PPTX), doc_type `notes` | Message "Document stored successfully", `total_chunks` > 0, `doc_type` `notes` |
| 2 | Search with filter | `/search?query=information security&doc_type=past_paper` | Results ki list (ya khali agar past paper me topic nahi), 500 error nahi |
| 3 | Summary | `Summarize the information security topic` | `intent` `summary`, summary, key points aur study steps |
| 4 | Quiz | `Make a quiz on the information security topic` | `intent` `quiz`, 5 questions, har ke 4 options aur answer |
| 5 | Past paper | `Give me past paper questions on the information security topic` (past paper upload hone ke baad) | `intent` `past_paper`, questions ki list, har ek ka `type` short ya long |
| 6 | Clarify | `Hi there` | `intent` `clarify`, English message "This question does not seem related to your notes" |
| 7 | Topic not in notes | `Summarize the machine learning topic` | `topic` ke saath "This topic was not found in your notes." |
| 8 | Invalid doc_type | `/store-document` me doc_type `abc` | HTTP 400, detail "doc_type must be 'notes' or 'past_paper'" |

## Frontend checks

1. Dashboard par 3 cards dikhen, sidebar par 4 links.
2. `/upload` par file select karke Upload & Store se "Stored X chunks" message aaye.
3. `/study-plan` par topic likh kar summary, key points aur steps dikhen.
4. `/ask` par Search, Summary, Quiz aur Past Papers tabs kaam karein, aur har tab ka result white card me dikhe.

## Known limitations

- Chunk size 1000 characters hai (note me 200 se 500 tokens likha hai), kyunki embedding model `all-MiniLM-L6-v2` 256 tokens tak padhta hai.
- LLM `openai/gpt-oss-120b` hai (Groq), note me Llama likha hai. Llama model Groq account par abhi enable nahi hai.
- Past paper questions abhi lecture file se bhi bante hain. Asli past papers par test karna baaki hai.
- Clarify me follow-up question abhi nahi hai, sirf message aata hai.