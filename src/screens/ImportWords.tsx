import { useMemo, useState } from "react";
import { BrandMark } from "../components/BrandMark";
import { parseWordCsv } from "../lib/csv";
import type { WordEntry } from "../types";

type ImportWordsProps = {
  onCancel: () => void;
  onSave: (words: WordEntry[], name: string) => void;
};

export function ImportWords({ onCancel, onSave }: ImportWordsProps) {
  const [text, setText] = useState("word,clue\n");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<WordEntry[] | null>(null);

  const hint = useMemo(
    () =>
      'Use columns "word" and "clue". Importing replaces the starter word list. Example: because,for the reason that',
    [],
  );

  function tryParse(value: string) {
    const result = parseWordCsv(value);
    if (!result.ok) {
      setError(result.error);
      setPreview(null);
      return null;
    }
    setError(null);
    setPreview(result.words);
    return result.words;
  }

  return (
    <section className="panel import">
      <BrandMark />
      <h1>Import words</h1>
      <p className="lede">{hint}</p>

      <label className="field">
        <span>CSV file</span>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const content = await file.text();
            setText(content);
            tryParse(content);
          }}
        />
      </label>

      <label className="field">
        <span>Or paste CSV</span>
        <textarea
          value={text}
          rows={8}
          spellCheck={false}
          onChange={(event) => {
            setText(event.target.value);
            setPreview(null);
            setError(null);
          }}
        />
      </label>

      {error && <p className="banner error">{error}</p>}

      {preview && (
        <div className="preview">
          <p>
            Ready to import <strong>{preview.length}</strong> words
          </p>
          <ul>
            {preview.slice(0, 5).map((entry) => (
              <li key={`${entry.word}-${entry.clue}`}>
                <strong>{entry.word}</strong> — {entry.clue}
              </li>
            ))}
            {preview.length > 5 && <li>…and {preview.length - 5} more</li>}
          </ul>
        </div>
      )}

      <div className="row">
        <button type="button" className="btn secondary" onClick={onCancel}>
          Back
        </button>
        <button
          type="button"
          className="btn ghost"
          onClick={() => tryParse(text)}
        >
          Preview
        </button>
        <button
          type="button"
          className="btn primary"
          onClick={() => {
            const words = tryParse(text);
            if (words) onSave(words, "Imported list");
          }}
        >
          Save list
        </button>
      </div>
    </section>
  );
}
