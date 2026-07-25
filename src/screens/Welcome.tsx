import { BrandMark } from "../components/BrandMark";

type WelcomeProps = {
  initialName?: string;
  onStart: (nickname: string) => void;
};

export function Welcome({ initialName = "", onStart }: WelcomeProps) {
  return (
    <section className="panel welcome">
      <BrandMark />
      <h1>What should we call you?</h1>
      <p className="lede">Pick a nickname for the leaderboard.</p>
      <form
        className="stack"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const nickname = String(form.get("nickname") ?? "").trim();
          if (nickname) onStart(nickname);
        }}
      >
        <label className="field">
          <span>Nickname</span>
          <input
            name="nickname"
            defaultValue={initialName}
            autoComplete="off"
            autoFocus
            maxLength={20}
            placeholder="e.g. SuperSpeller"
            required
          />
        </label>
        <button type="submit" className="btn primary">
          Let&apos;s play
        </button>
      </form>
    </section>
  );
}
