import { useMemo, useState } from "react";
import { createLocalScoreStore } from "./lib/scoreStore";
import {
  ensureWordList,
  getNickname,
  resetToDefaultWordList,
  setNickname,
  setWordList,
} from "./lib/storage";
import { DailyPoints } from "./screens/DailyPoints";
import { Home } from "./screens/Home";
import { ImportWords } from "./screens/ImportWords";
import { Leaderboard } from "./screens/Leaderboard";
import { Practice } from "./screens/Practice";
import { Settings } from "./screens/Settings";
import { Welcome } from "./screens/Welcome";
import type { AppView, PracticeMode, WordEntry } from "./types";
import "./App.css";

const scoreStore = createLocalScoreStore();

export default function App() {
  const [view, setView] = useState<AppView>(() =>
    getNickname() ? "home" : "welcome",
  );
  const [nickname, setNicknameState] = useState(() => getNickname() ?? "");
  const [wordList, setWordListState] = useState(() => ensureWordList());
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("meaning");
  const [pointsVersion, setPointsVersion] = useState(0);

  const points = useMemo(() => {
    void pointsVersion;
    return nickname ? scoreStore.getPoints(nickname) : 0;
  }, [nickname, pointsVersion]);

  const leaderboard = useMemo(() => {
    void pointsVersion;
    return scoreStore.getLeaderboard();
  }, [pointsVersion]);

  const dailyPoints = useMemo(() => {
    void pointsVersion;
    return nickname ? scoreStore.getDailyPoints(nickname) : {};
  }, [nickname, pointsVersion]);

  function startAs(name: string) {
    setNickname(name);
    setNicknameState(name);
    setView("home");
  }

  function saveImportedWords(words: WordEntry[], name: string) {
    const list = {
      id: crypto.randomUUID(),
      name,
      words,
    };
    setWordList(list);
    setWordListState(list);
    setView("home");
  }

  return (
    <div className="app-shell">
      <div className="glow glow-a" aria-hidden />
      <div className="glow glow-b" aria-hidden />
      <main className="app-main">
        {view === "welcome" && (
          <Welcome initialName={nickname} onStart={startAs} />
        )}

        {view === "home" && (
          <Home
            nickname={nickname}
            points={points}
            hasWords={wordList.words.length > 0}
            wordCount={wordList.words.length}
            listName={wordList.name}
            onPractice={(mode) => {
              setPracticeMode(mode);
              setView("practice");
            }}
            onImport={() => setView("import")}
            onLeaderboard={() => setView("leaderboard")}
            onDailyPoints={() => setView("daily-points")}
            onSettings={() => setView("settings")}
            onChangeName={() => setView("welcome")}
          />
        )}

        {view === "import" && (
          <ImportWords
            onCancel={() => setView("home")}
            onSave={saveImportedWords}
          />
        )}

        {view === "leaderboard" && (
          <Leaderboard
            entries={leaderboard}
            currentNickname={nickname}
            onBack={() => setView("home")}
          />
        )}

        {view === "daily-points" && (
          <DailyPoints
            nickname={nickname}
            totalPoints={points}
            dailyPoints={dailyPoints}
            onBack={() => setView("home")}
          />
        )}

        {view === "settings" && (
          <Settings
            nickname={nickname}
            onResetPoints={() => {
              scoreStore.resetPoints(nickname);
              setPointsVersion((v) => v + 1);
            }}
            onResetWordList={() => {
              setWordListState(resetToDefaultWordList());
            }}
            onBack={() => setView("home")}
          />
        )}

        {view === "practice" && (
          <Practice
            key={`${practiceMode}-${wordList.id}`}
            mode={practiceMode}
            words={wordList.words}
            nickname={nickname}
            totalPoints={points}
            onEarnPoints={(earned) => {
              scoreStore.addPoints(nickname, earned);
              setPointsVersion((value) => value + 1);
            }}
            onExit={() => setView("home")}
          />
        )}
      </main>
    </div>
  );
}
