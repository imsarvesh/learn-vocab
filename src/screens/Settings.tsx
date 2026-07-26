import { useState } from "react";
import { BrandMark } from "../components/BrandMark";

type ConfirmKind = "points" | "words" | null;

type SettingsProps = {
  nickname: string;
  onImport: () => void;
  onResetPoints: () => void;
  onResetWordList: () => void;
  onBack: () => void;
};

export function Settings({
  nickname,
  onImport,
  onResetPoints,
  onResetWordList,
  onBack,
}: SettingsProps) {
  const [confirm, setConfirm] = useState<ConfirmKind>(null);
  const [message, setMessage] = useState<string | null>(null);

  function askReset(kind: Exclude<ConfirmKind, null>) {
    setMessage(null);
    setConfirm(kind);
  }

  function cancel() {
    setConfirm(null);
  }

  function confirmAction() {
    if (confirm === "points") {
      onResetPoints();
      setMessage("Your points were reset.");
    } else if (confirm === "words") {
      onResetWordList();
      setMessage("Word list restored to starter words.");
    }
    setConfirm(null);
  }

  return (
    <section className="panel settings">
      <BrandMark />
      <h1>Settings</h1>
      <p className="lede">Manage your progress on this device.</p>

      {message ? <p className="banner success">{message}</p> : null}

      <div className="settings-block">
        <h2>Your points</h2>
        <p className="meta">
          Clears lifetime and daily points for {nickname} only. Other players
          stay.
        </p>
        {confirm === "points" ? (
          <div className="confirm-row">
            <p className="confirm-copy">
              Reset your points? This cannot be undone.
            </p>
            <div className="row">
              <button type="button" className="btn secondary" onClick={cancel}>
                Cancel
              </button>
              <button
                type="button"
                className="btn danger"
                onClick={confirmAction}
              >
                Confirm
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="btn danger"
            onClick={() => askReset("points")}
          >
            Reset my points
          </button>
        )}
      </div>

      <div className="settings-block">
        <h2>Word list</h2>
        <p className="meta">
          Import a CSV list, or restore the built-in starter words.
        </p>
        <button type="button" className="btn secondary" onClick={onImport}>
          Import words
        </button>
        {confirm === "words" ? (
          <div className="confirm-row">
            <p className="confirm-copy">
              Restore the starter word list? Your import will be removed.
            </p>
            <div className="row">
              <button type="button" className="btn secondary" onClick={cancel}>
                Cancel
              </button>
              <button
                type="button"
                className="btn danger"
                onClick={confirmAction}
              >
                Confirm
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="btn danger"
            onClick={() => askReset("words")}
          >
            Reset word list
          </button>
        )}
      </div>

      <button type="button" className="btn secondary" onClick={onBack}>
        Back home
      </button>
    </section>
  );
}
