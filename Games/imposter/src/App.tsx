import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { categories, getRandomWord } from "./data/words";

// ============ TYPES ============
type GamePhase =
  | "MENU"
  | "SETUP"
  | "ROLE_REVEAL"
  | "DISCUSSION"
  | "VOTING"
  | "VOTE_RESULTS"
  | "IMPOSTER_GUESS"
  | "GAME_OVER";

interface Player {
  id: number;
  name: string;
  isImposter: boolean;
  isEliminated: boolean;
  votedFor: number | null;
  clue: string;
}

interface GameState {
  phase: GamePhase;
  players: Player[];
  secretWord: string;
  category: string;
  imposterCount: number;
  currentPlayerIndex: number;
  round: number;
  votedOutPlayerId: number | null;
  imposterGuess: string;
  gameResult: "crew_wins" | "imposter_wins" | null;
  selectedCategory: number | null;
}

const initialGameState: GameState = {
  phase: "MENU",
  players: [],
  secretWord: "",
  category: "",
  imposterCount: 1,
  currentPlayerIndex: 0,
  round: 1,
  votedOutPlayerId: null,
  imposterGuess: "",
  gameResult: null,
  selectedCategory: null,
};

// ============ UTILITY COMPONENTS ============

function StarField() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: Math.random() * 3 + 1 + "px",
            height: Math.random() * 3 + 1 + "px",
            top: Math.random() * 100 + "%",
            left: Math.random() * 100 + "%",
            opacity: Math.random() * 0.5 + 0.1,
            animation: `float ${3 + Math.random() * 4}s ease-in-out ${Math.random() * 2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "danger" | "success" | "ghost" | "gold";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
}) {
  const baseClasses =
    "font-bold rounded-2xl transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer select-none";
  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };
  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25",
    danger: "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/25",
    success: "bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-600/25",
    ghost: "bg-white/10 hover:bg-white/20 text-white border border-white/20",
    gold: "bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg shadow-yellow-500/25",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

// ============ MENU SCREEN ============
function MenuScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="animate-fade-in-scale">
        <div className="text-8xl mb-4 animate-float">🕵️</div>
        <h1 className="text-6xl font-black text-white mb-2 tracking-tight">
          IMPOSTER
        </h1>
        <p className="text-xl text-blue-300 mb-2 font-medium">Word Party Game</p>
        <p className="text-sm text-white/40 mb-10 max-w-xs mx-auto">
          Find the imposter among you... or blend in if you are one!
        </p>
      </div>

      <div className="animate-slide-up space-y-4 w-full max-w-xs">
        <Button onClick={onStart} size="lg" className="w-full">
          🎮 Start Game
        </Button>
      </div>

      <div className="animate-fade-in mt-12 text-white/30 text-xs max-w-sm space-y-3">
        <div className="bg-white/5 rounded-2xl p-4 text-left space-y-2">
          <p className="text-white/50 font-semibold text-sm">📜 How to Play</p>
          <p>Everyone gets a secret word — except the imposter.</p>
          <p>Take turns saying a clue word. The imposter must blend in!</p>
          <p>Vote on who you think the imposter is.</p>
        </div>
      </div>
    </div>
  );
}

// ============ SETUP SCREEN ============
function SetupScreen({
  onStartGame,
  onBack,
}: {
  onStartGame: (names: string[], imposterCount: number, categoryIdx: number | null) => void;
  onBack: () => void;
}) {
  const [playerCount, setPlayerCount] = useState(4);
  const [names, setNames] = useState<string[]>(Array(12).fill(""));
  const [imposterCount, setImposterCount] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [step, setStep] = useState<"count" | "names" | "settings">("count");

  const maxImposters = Math.max(1, Math.floor(playerCount / 3));

  const updateName = (index: number, value: string) => {
    const next = [...names];
    next[index] = value;
    setNames(next);
  };

  const allNamesValid = useMemo(() => {
    const usedNames = names.slice(0, playerCount);
    return (
      usedNames.every((n) => n.trim().length > 0) &&
      new Set(usedNames.map((n) => n.trim().toLowerCase())).size === playerCount
    );
  }, [names, playerCount]);

  const handleStart = () => {
    const finalNames = names.slice(0, playerCount).map((n) => n.trim());
    onStartGame(finalNames, imposterCount, selectedCategory);
  };

  return (
    <div className="min-h-screen flex flex-col p-6 max-w-lg mx-auto">
      <button onClick={onBack} className="text-white/50 hover:text-white text-sm mb-6 self-start cursor-pointer">
        ← Back to Menu
      </button>

      {step === "count" && (
        <div className="animate-fade-in flex-1 flex flex-col">
          <h2 className="text-3xl font-black text-white mb-2">How many players?</h2>
          <p className="text-white/40 mb-8">You need at least 3 players</p>

          <div className="flex items-center justify-center gap-6 mb-8">
            <button
              onClick={() => setPlayerCount(Math.max(3, playerCount - 1))}
              className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl font-bold transition-all cursor-pointer"
            >
              −
            </button>
            <span className="text-7xl font-black text-white w-24 text-center animate-count-pulse" key={playerCount}>
              {playerCount}
            </span>
            <button
              onClick={() => setPlayerCount(Math.min(12, playerCount + 1))}
              className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl font-bold transition-all cursor-pointer"
            >
              +
            </button>
          </div>

          <div className="mt-auto">
            <Button onClick={() => setStep("names")} size="lg" className="w-full">
              Next →
            </Button>
          </div>
        </div>
      )}

      {step === "names" && (
        <div className="animate-fade-in flex-1 flex flex-col">
          <h2 className="text-3xl font-black text-white mb-2">Player Names</h2>
          <p className="text-white/40 mb-6">Enter everyone's name</p>

          <div className="space-y-3 mb-8 overflow-y-auto flex-1">
            {Array.from({ length: playerCount }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center text-blue-300 text-sm font-bold shrink-0">
                  {i + 1}
                </div>
                <input
                  type="text"
                  value={names[i]}
                  onChange={(e) => updateName(i, e.target.value)}
                  placeholder={`Player ${i + 1}`}
                  maxLength={16}
                  className="flex-1 bg-bg-input border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button onClick={() => setStep("count")} variant="ghost" size="md" className="flex-1">
              ← Back
            </Button>
            <Button onClick={() => setStep("settings")} size="md" className="flex-1" disabled={!allNamesValid}>
              Next →
            </Button>
          </div>
        </div>
      )}

      {step === "settings" && (
        <div className="animate-fade-in flex-1 flex flex-col">
          <h2 className="text-3xl font-black text-white mb-2">Game Settings</h2>
          <p className="text-white/40 mb-8">Customize your game</p>

          {/* Imposter Count */}
          <div className="bg-bg-card rounded-2xl p-5 mb-4 border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-white font-bold">🕵️ Imposters</p>
                <p className="text-white/30 text-sm">Max {maxImposters} for {playerCount} players</p>
              </div>
            </div>
            <div className="flex gap-2">
              {Array.from({ length: maxImposters }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setImposterCount(i + 1)}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all cursor-pointer ${
                    imposterCount === i + 1
                      ? "bg-red-600 text-white shadow-lg shadow-red-600/25"
                      : "bg-white/5 text-white/40 hover:bg-white/10"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Category Selection */}
          <div className="bg-bg-card rounded-2xl p-5 mb-8 border border-white/5">
            <p className="text-white font-bold mb-3">📂 Word Category</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`py-3 px-3 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                  selectedCategory === null
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                    : "bg-white/5 text-white/40 hover:bg-white/10"
                }`}
              >
                🎲 Random
              </button>
              {categories.map((cat, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedCategory(i)}
                  className={`py-3 px-3 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                    selectedCategory === i
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                      : "bg-white/5 text-white/40 hover:bg-white/10"
                  }`}
                >
                  {cat.emoji} {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto flex gap-3">
            <Button onClick={() => setStep("names")} variant="ghost" size="md" className="flex-1">
              ← Back
            </Button>
            <Button onClick={handleStart} variant="success" size="lg" className="flex-1">
              🚀 Start!
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ ROLE REVEAL SCREEN ============
function RoleRevealScreen({
  player,
  secretWord,
  category,
  onNext,
  currentIndex,
  totalPlayers,
  nextPlayerName,
}: {
  player: Player;
  secretWord: string;
  category: string;
  onNext: () => void;
  currentIndex: number;
  totalPlayers: number;
  nextPlayerName?: string;
}) {
  const [revealed, setRevealed] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    setRevealed(false);
    setConfirmed(false);
  }, [player.id]);

  if (confirmed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="text-5xl mb-6">📱</div>
        <h2 className="text-2xl font-black text-white mb-2">Pass the phone to</h2>
        {currentIndex < totalPlayers - 1 ? (
          <>
            <p className="text-blue-400 font-bold text-2xl mb-8">
              {nextPlayerName}
            </p>
            <Button onClick={onNext} size="lg">
              I'm ready! 👀
            </Button>
          </>
        ) : (
          <>
            <p className="text-white/40 mb-8">Everyone has seen their role!</p>
            <Button onClick={onNext} size="lg" variant="success">
              Start Discussion! 💬
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      {/* Progress */}
      <div className="absolute top-6 left-6 right-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/30 text-sm">Role Reveal</span>
          <span className="text-white/30 text-sm">
            {currentIndex + 1} / {totalPlayers}
          </span>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / totalPlayers) * 100}%` }}
          />
        </div>
      </div>

      <div className="animate-fade-in-scale">
        <p className="text-white/40 text-sm mb-2 uppercase tracking-widest">This is for</p>
        <h2 className="text-4xl font-black text-white mb-8">{player.name}</h2>

        {!revealed ? (
          <div>
            <button
              onClick={() => setRevealed(true)}
              className="w-48 h-48 rounded-3xl bg-bg-card border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-3 hover:border-white/40 hover:bg-bg-card-hover transition-all mx-auto cursor-pointer active:scale-95"
            >
              <span className="text-5xl">🔒</span>
              <span className="text-white/50 font-medium">Tap to reveal</span>
            </button>
            <p className="text-white/20 text-xs mt-4">Make sure only {player.name} can see!</p>
          </div>
        ) : (
          <div className="animate-fade-in-scale">
            {player.isImposter ? (
              <div className="bg-gradient-to-b from-red-900/40 to-red-950/40 border border-red-500/30 rounded-3xl p-8 animate-pulse-glow max-w-sm mx-auto">
                <div className="text-6xl mb-4">🕵️</div>
                <h3 className="text-3xl font-black text-red-400 mb-2">IMPOSTER</h3>
                <p className="text-red-300/60 text-sm mb-4">You don't know the word!</p>
                <div className="bg-red-950/50 rounded-xl p-3">
                  <p className="text-red-300/40 text-xs uppercase tracking-wider mb-1">Category</p>
                  <p className="text-red-200 font-bold">{category}</p>
                </div>
                <p className="text-red-300/40 text-xs mt-4">Blend in. Don't get caught.</p>
              </div>
            ) : (
              <div className="bg-gradient-to-b from-blue-900/40 to-blue-950/40 border border-blue-500/30 rounded-3xl p-8 animate-pulse-glow-blue max-w-sm mx-auto">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-3xl font-black text-blue-400 mb-2">CREWMATE</h3>
                <p className="text-blue-300/60 text-sm mb-4">The secret word is:</p>
                <div className="bg-blue-950/50 rounded-xl p-4">
                  <p className="text-3xl font-black text-white">{secretWord}</p>
                  <p className="text-blue-300/40 text-xs mt-1">{category}</p>
                </div>
                <p className="text-blue-300/40 text-xs mt-4">Find the imposter!</p>
              </div>
            )}

            <Button
              onClick={() => setConfirmed(true)}
              variant="ghost"
              size="lg"
              className="mt-8"
            >
              Got it! Hide my role 🙈
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ DISCUSSION SCREEN ============
function DiscussionScreen({
  players,
  round,
  onProceedToVote,
  onNextRound,
}: {
  players: Player[];
  round: number;
  onProceedToVote: () => void;
  onNextRound: () => void;
}) {
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timerDuration] = useState(60);
  const intervalRef = useRef<number | null>(null);

  const activePlayers = players.filter((p) => !p.isEliminated);

  useEffect(() => {
    if (timerActive && timer > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            setTimerActive(false);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerActive, timer]);

  const startTimer = () => {
    setTimer(timerDuration);
    setTimerActive(true);
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen flex flex-col p-6 max-w-lg mx-auto">
      <div className="text-center mb-6 animate-fade-in">
        <div className="inline-flex items-center gap-2 bg-white/5 rounded-full px-4 py-1 text-white/40 text-sm mb-3">
          <span>💬</span> Round {round}
        </div>
        <h2 className="text-3xl font-black text-white mb-2">Discussion Time!</h2>
        <p className="text-white/40 text-sm">
          Each player says <span className="text-blue-400">one word</span> related to the secret word
        </p>
      </div>

      {/* Timer */}
      <div className="bg-bg-card rounded-2xl p-4 mb-6 border border-white/5 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/30 text-xs uppercase tracking-wider">Timer (Optional)</p>
            {timer > 0 ? (
              <p className={`text-3xl font-black font-mono ${timer <= 10 ? "text-red-400" : "text-white"}`}>
                {formatTime(timer)}
              </p>
            ) : (
              <p className="text-white/20 text-lg">Not started</p>
            )}
          </div>
          {!timerActive ? (
            <Button onClick={startTimer} size="sm" variant="ghost">
              ⏱️ {timer > 0 ? "Restart" : "Start"} Timer
            </Button>
          ) : (
            <Button onClick={() => setTimerActive(false)} size="sm" variant="ghost">
              ⏸️ Pause
            </Button>
          )}
        </div>
      </div>

      {/* Player Order */}
      <div className="bg-bg-card rounded-2xl p-4 mb-6 border border-white/5 animate-slide-up">
        <p className="text-white/30 text-xs uppercase tracking-wider mb-3">Speaking Order</p>
        <div className="space-y-2">
          {activePlayers.map((player, i) => (
            <div
              key={player.id}
              className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center text-blue-300 text-sm font-bold">
                {i + 1}
              </div>
              <span className="text-white font-medium flex-1">{player.name}</span>
              <span className="text-white/20 text-xl">🎤</span>
            </div>
          ))}
        </div>
      </div>

      {/* Strategy Tips */}
      <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-2xl p-4 mb-8 animate-fade-in">
        <p className="text-yellow-400/60 text-xs font-bold uppercase tracking-wider mb-2">💡 Tip</p>
        <p className="text-yellow-200/40 text-sm">
          {round === 1
            ? "Don't be too obvious with your clue or the imposter will figure out the word!"
            : "Pay attention to who's being vague. They might be the imposter!"}
        </p>
      </div>

      <div className="mt-auto flex gap-3">
        <Button onClick={onNextRound} variant="ghost" size="md" className="flex-1">
          🔄 Another Round
        </Button>
        <Button onClick={onProceedToVote} variant="danger" size="lg" className="flex-1">
          🗳️ Vote Now
        </Button>
      </div>
    </div>
  );
}

// ============ VOTING SCREEN ============
function VotingScreen({
  players,
  onComplete,
}: {
  players: Player[];
  onComplete: (votes: Map<number, number>) => void;
}) {
  const [currentVoterIdx, setCurrentVoterIdx] = useState(0);
  const [votes, setVotes] = useState<Map<number, number>>(new Map());
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [readyToVote, setReadyToVote] = useState(false);

  const activePlayers = players.filter((p) => !p.isEliminated);
  const currentVoter = activePlayers[currentVoterIdx];

  const confirmVote = () => {
    if (selectedPlayer === null) return;
    const newVotes = new Map(votes);
    newVotes.set(currentVoter.id, selectedPlayer);
    setVotes(newVotes);
    setSelectedPlayer(null);
    setShowConfirm(false);
    setReadyToVote(false);

    if (currentVoterIdx < activePlayers.length - 1) {
      setCurrentVoterIdx(currentVoterIdx + 1);
    } else {
      onComplete(newVotes);
    }
  };

  if (!readyToVote) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="inline-flex items-center gap-2 bg-white/5 rounded-full px-4 py-1 text-white/40 text-sm mb-6">
          <span>🗳️</span> Vote {currentVoterIdx + 1} of {activePlayers.length}
        </div>
        <div className="text-5xl mb-6">📱</div>
        <h2 className="text-2xl font-black text-white mb-2">Pass the phone to</h2>
        <p className="text-blue-400 font-bold text-2xl mb-2">{currentVoter.name}</p>
        <p className="text-white/40 mb-8">Make sure only they can see the screen</p>
        <Button onClick={() => setReadyToVote(true)} size="lg">
          I'm {currentVoter.name} 👋
        </Button>
      </div>
    );
  }

  if (showConfirm) {
    const votedPlayer = players.find((p) => p.id === selectedPlayer)!;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center animate-fade-in-scale">
        <h2 className="text-2xl font-black text-white mb-2">Confirm your vote</h2>
        <p className="text-white/40 mb-6">You're voting for:</p>
        <div className="bg-red-900/30 border border-red-500/30 rounded-2xl p-6 mb-8">
          <p className="text-3xl font-black text-red-400">{votedPlayer.name}</p>
        </div>
        <div className="flex gap-3 w-full max-w-xs">
          <Button onClick={() => { setShowConfirm(false); setSelectedPlayer(null); }} variant="ghost" className="flex-1">
            Cancel
          </Button>
          <Button onClick={confirmVote} variant="danger" className="flex-1">
            Confirm ✓
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-6 max-w-lg mx-auto">
      <div className="text-center mb-6 animate-fade-in">
        <div className="inline-flex items-center gap-2 bg-white/5 rounded-full px-4 py-1 text-white/40 text-sm mb-3">
          <span>🗳️</span> Vote {currentVoterIdx + 1} of {activePlayers.length}
        </div>
        <h2 className="text-3xl font-black text-white mb-1">{currentVoter.name}</h2>
        <p className="text-white/40 text-sm">Who do you think is the imposter?</p>
      </div>

      <div className="space-y-3 flex-1 animate-slide-up">
        {activePlayers
          .filter((p) => p.id !== currentVoter.id)
          .map((player, i) => (
            <button
              key={player.id}
              onClick={() => setSelectedPlayer(player.id)}
              className={`w-full flex items-center gap-4 rounded-2xl px-5 py-4 transition-all cursor-pointer active:scale-[0.98] ${
                selectedPlayer === player.id
                  ? "bg-red-600/20 border-2 border-red-500/50 shadow-lg shadow-red-500/10"
                  : "bg-bg-card border-2 border-transparent hover:bg-bg-card-hover"
              }`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                  selectedPlayer === player.id
                    ? "bg-red-600 text-white"
                    : "bg-white/10 text-white/40"
                }`}
              >
                {player.name.charAt(0).toUpperCase()}
              </div>
              <span className={`text-lg font-medium ${selectedPlayer === player.id ? "text-red-300" : "text-white"}`}>
                {player.name}
              </span>
              {selectedPlayer === player.id && <span className="ml-auto text-red-400 text-xl">🎯</span>}
            </button>
          ))}
      </div>

      <div className="mt-6">
        <Button
          onClick={() => setShowConfirm(true)}
          variant="danger"
          size="lg"
          className="w-full"
          disabled={selectedPlayer === null}
        >
          Submit Vote
        </Button>
      </div>
    </div>
  );
}

// ============ VOTE RESULTS SCREEN ============
function VoteResultsScreen({
  players,
  votes,
  onContinue,
}: {
  players: Player[];
  votes: Map<number, number>;
  onContinue: (votedOutId: number) => void;
}) {
  const [showResults, setShowResults] = useState(false);

  // Tally votes
  const voteTally = useMemo(() => {
    const tally = new Map<number, number>();
    players.filter(p => !p.isEliminated).forEach((p) => tally.set(p.id, 0));
    votes.forEach((votedFor) => {
      tally.set(votedFor, (tally.get(votedFor) || 0) + 1);
    });
    return tally;
  }, [players, votes]);

  const sortedResults = useMemo(() => {
    return players
      .filter((p) => !p.isEliminated)
      .map((p) => ({
        player: p,
        votes: voteTally.get(p.id) || 0,
      }))
      .sort((a, b) => b.votes - a.votes);
  }, [players, voteTally]);

  const maxVotes = sortedResults[0]?.votes || 0;
  const topVoted = sortedResults.filter((r) => r.votes === maxVotes);
  const isTie = topVoted.length > 1;
  // On tie, pick randomly among tied
  const votedOutPlayer = useMemo(() => {
    if (isTie) {
      return topVoted[Math.floor(Math.random() * topVoted.length)].player;
    }
    return topVoted[0]?.player;
  }, [topVoted, isTie]);

  useEffect(() => {
    const t = setTimeout(() => setShowResults(true), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col p-6 max-w-lg mx-auto">
      <div className="text-center mb-8 animate-fade-in">
        <h2 className="text-3xl font-black text-white mb-2">Vote Results</h2>
        <p className="text-white/40 text-sm">The people have spoken...</p>
      </div>

      <div className="space-y-3 mb-8">
        {sortedResults.map((result, i) => (
          <div
            key={result.player.id}
            className={`flex items-center gap-4 rounded-2xl px-5 py-4 transition-all duration-700 ${
              showResults && result.player.id === votedOutPlayer?.id
                ? "bg-red-900/30 border-2 border-red-500/40"
                : "bg-bg-card border-2 border-transparent"
            }`}
            style={{
              opacity: showResults ? 1 : 0,
              transform: showResults ? "translateX(0)" : "translateX(20px)",
              transition: `all 0.5s ease ${i * 150}ms`,
            }}
          >
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold">
              {result.player.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-white font-medium flex-1">{result.player.name}</span>
            <div className="flex items-center gap-2">
              <div className="bg-white/10 rounded-lg px-3 py-1">
                <span className="text-white font-bold">{result.votes}</span>
                <span className="text-white/40 text-sm ml-1">vote{result.votes !== 1 ? "s" : ""}</span>
              </div>
              {showResults && result.player.id === votedOutPlayer?.id && <span className="text-red-400">❌</span>}
            </div>
          </div>
        ))}
      </div>

      {showResults && (
        <div className="animate-fade-in-scale text-center mb-6">
          {isTie && (
            <p className="text-yellow-400 text-sm mb-2">⚡ Tie broken randomly!</p>
          )}
          <div className="bg-red-900/20 border border-red-500/20 rounded-2xl p-6">
            <p className="text-white/40 text-sm mb-1">Voted out:</p>
            <p className="text-3xl font-black text-red-400">{votedOutPlayer?.name}</p>
          </div>
        </div>
      )}

      {showResults && (
        <div className="mt-auto animate-slide-up">
          <Button
            onClick={() => votedOutPlayer && onContinue(votedOutPlayer.id)}
            size="lg"
            variant="danger"
            className="w-full"
          >
            Reveal Identity! 🔍
          </Button>
        </div>
      )}
    </div>
  );
}

// ============ IMPOSTER GUESS SCREEN ============
function ImposterGuessScreen({
  imposter,
  secretWord,
  category,
  onGuess,
  onSkip,
}: {
  imposter: Player;
  secretWord: string;
  category: string;
  onGuess: (correct: boolean) => void;
  onSkip: () => void;
}) {
  const [guess, setGuess] = useState("");
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);

  const handleGuess = () => {
    const isCorrect = guess.trim().toLowerCase() === secretWord.toLowerCase();
    setResult(isCorrect ? "correct" : "wrong");
    setTimeout(() => onGuess(isCorrect), 2000);
  };

  if (result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center animate-fade-in-scale">
        {result === "correct" ? (
          <>
            <div className="text-7xl mb-4">🎉</div>
            <h2 className="text-4xl font-black text-green-400 mb-2">CORRECT!</h2>
            <p className="text-white/40">The word was <span className="text-white font-bold">{secretWord}</span></p>
            <p className="text-red-400 font-bold mt-4 text-lg">The imposter wins anyway!</p>
          </>
        ) : (
          <>
            <div className="text-7xl mb-4">❌</div>
            <h2 className="text-4xl font-black text-red-400 mb-2">WRONG!</h2>
            <p className="text-white/40">
              You guessed: <span className="text-red-300 font-bold">{guess}</span>
            </p>
            <p className="text-white/40">
              The word was: <span className="text-white font-bold">{secretWord}</span>
            </p>
            <p className="text-blue-400 font-bold mt-4 text-lg">Crewmates win!</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
      <div className="animate-fade-in-scale">
        <div className="text-6xl mb-4">🕵️</div>
        <h2 className="text-3xl font-black text-red-400 mb-2">Last Chance!</h2>
        <p className="text-white/40 mb-1">
          <span className="text-red-300 font-bold">{imposter.name}</span> was caught!
        </p>
        <p className="text-white/40 mb-8">
          But they can still win by guessing the secret word
        </p>

        <div className="bg-bg-card rounded-2xl p-4 mb-4 border border-white/5">
          <p className="text-white/30 text-xs uppercase tracking-wider mb-1">Category Hint</p>
          <p className="text-white font-bold text-lg">{category}</p>
        </div>

        <input
          type="text"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="Type your guess..."
          className="w-full bg-bg-input border-2 border-red-500/30 rounded-xl px-6 py-4 text-white text-xl text-center placeholder-white/20 focus:outline-none focus:border-red-500 transition-all mb-4"
          onKeyDown={(e) => e.key === "Enter" && guess.trim() && handleGuess()}
        />

        <div className="flex gap-3 w-full">
          <Button onClick={onSkip} variant="ghost" className="flex-1">
            Skip Guess
          </Button>
          <Button onClick={handleGuess} variant="danger" className="flex-1" disabled={!guess.trim()}>
            Guess! 🎯
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============ GAME OVER SCREEN ============
function GameOverScreen({
  result,
  players,
  secretWord,
  onPlayAgain,
  onMenu,
}: {
  result: "crew_wins" | "imposter_wins";
  players: Player[];
  secretWord: string;
  onPlayAgain: () => void;
  onMenu: () => void;
}) {
  const imposters = players.filter((p) => p.isImposter);
  const crewmates = players.filter((p) => !p.isImposter);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="animate-fade-in-scale">
        {result === "crew_wins" ? (
          <>
            <div className="text-8xl mb-4">🎉</div>
            <h2 className="text-5xl font-black text-blue-400 mb-2">CREWMATES WIN!</h2>
            <p className="text-white/40 text-lg">The imposters have been caught!</p>
          </>
        ) : (
          <>
            <div className="text-8xl mb-4">🕵️</div>
            <h2 className="text-5xl font-black text-red-400 mb-2">IMPOSTER WINS!</h2>
            <p className="text-white/40 text-lg">The imposter fooled everyone!</p>
          </>
        )}
      </div>

      <div className="w-full max-w-sm mt-8 space-y-4 animate-slide-up">
        <div className="bg-bg-card rounded-2xl p-5 border border-white/5">
          <p className="text-white/30 text-xs uppercase tracking-wider mb-1">Secret Word</p>
          <p className="text-2xl font-black text-white">{secretWord}</p>
        </div>

        <div className="bg-red-900/20 border border-red-500/20 rounded-2xl p-5">
          <p className="text-red-400/60 text-xs uppercase tracking-wider mb-2">
            🕵️ {imposters.length === 1 ? "Imposter" : "Imposters"}
          </p>
          {imposters.map((p) => (
            <p key={p.id} className="text-red-400 font-bold text-lg">{p.name}</p>
          ))}
        </div>

        <div className="bg-blue-900/20 border border-blue-500/20 rounded-2xl p-5">
          <p className="text-blue-400/60 text-xs uppercase tracking-wider mb-2">✅ Crewmates</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {crewmates.map((p) => (
              <span key={p.id} className="bg-blue-600/20 text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
                {p.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full max-w-sm mt-8 space-y-3 animate-fade-in">
        <Button onClick={onPlayAgain} size="lg" className="w-full" variant="success">
          🔄 Play Again
        </Button>
        <Button onClick={onMenu} size="md" className="w-full" variant="ghost">
          🏠 Main Menu
        </Button>
      </div>
    </div>
  );
}

// ============ MAIN APP ============
export default function App() {
  const [game, setGame] = useState<GameState>(initialGameState);
  // Store setup info for "play again"
  const [lastSetup, setLastSetup] = useState<{
    names: string[];
    imposterCount: number;
    categoryIdx: number | null;
  } | null>(null);

  const startGame = useCallback(
    (names: string[], imposterCount: number, categoryIdx: number | null) => {
      setLastSetup({ names, imposterCount, categoryIdx });
      initializeGame(names, imposterCount, categoryIdx);
    },
    []
  );

  const initializeGame = (
    names: string[],
    imposterCount: number,
    categoryIdx: number | null
  ) => {
    const { word, category } = getRandomWord(categoryIdx ?? undefined);

    // Assign imposters randomly
    const indices = names.map((_, i) => i);
    const imposterIndices = new Set<number>();
    while (imposterIndices.size < imposterCount) {
      const randIdx = Math.floor(Math.random() * indices.length);
      imposterIndices.add(indices[randIdx]);
    }

    const players: Player[] = names.map((name, i) => ({
      id: i,
      name,
      isImposter: imposterIndices.has(i),
      isEliminated: false,
      votedFor: null,
      clue: "",
    }));

    // Shuffle player order for discussion
    for (let i = players.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [players[i], players[j]] = [players[j], players[i]];
    }

    setGame({
      ...initialGameState,
      phase: "ROLE_REVEAL",
      players,
      secretWord: word,
      category,
      imposterCount,
      selectedCategory: categoryIdx,
      currentPlayerIndex: 0,
    });
  };

  const handleRoleRevealNext = () => {
    if (game.currentPlayerIndex < game.players.length - 1) {
      setGame((g) => ({ ...g, currentPlayerIndex: g.currentPlayerIndex + 1 }));
    } else {
      setGame((g) => ({ ...g, phase: "DISCUSSION", currentPlayerIndex: 0 }));
    }
  };

  const handleNextRound = () => {
    setGame((g) => ({ ...g, round: g.round + 1 }));
  };

  const handleVoteComplete = (votes: Map<number, number>) => {
    setGame((g) => ({
      ...g,
      phase: "VOTE_RESULTS",
      players: g.players.map((p) => ({
        ...p,
        votedFor: votes.get(p.id) ?? null,
      })),
    }));
  };

  const handleVoteResultContinue = (votedOutId: number) => {
    const votedOutPlayer = game.players.find((p) => p.id === votedOutId);
    if (!votedOutPlayer) return;

    if (votedOutPlayer.isImposter) {
      // Imposter was caught! They get a chance to guess
      setGame((g) => ({
        ...g,
        phase: "IMPOSTER_GUESS",
        votedOutPlayerId: votedOutId,
        players: g.players.map((p) =>
          p.id === votedOutId ? { ...p, isEliminated: true } : p
        ),
      }));
    } else {
      // Wrong person voted out - imposter wins!
      setGame((g) => ({
        ...g,
        phase: "GAME_OVER",
        votedOutPlayerId: votedOutId,
        gameResult: "imposter_wins",
        players: g.players.map((p) =>
          p.id === votedOutId ? { ...p, isEliminated: true } : p
        ),
      }));
    }
  };

  const handleImposterGuess = (correct: boolean) => {
    if (correct) {
      // Imposter guessed correctly - imposter wins
      setGame((g) => ({
        ...g,
        phase: "GAME_OVER",
        gameResult: "imposter_wins",
      }));
    } else {
      // Imposter guessed wrong - crew wins
      setGame((g) => ({
        ...g,
        phase: "GAME_OVER",
        gameResult: "crew_wins",
      }));
    }
  };

  const handleImposterSkipGuess = () => {
    setGame((g) => ({
      ...g,
      phase: "GAME_OVER",
      gameResult: "crew_wins",
    }));
  };

  const handlePlayAgain = () => {
    if (lastSetup) {
      initializeGame(lastSetup.names, lastSetup.imposterCount, lastSetup.categoryIdx);
    } else {
      setGame(initialGameState);
    }
  };

  const handleMenu = () => {
    setGame(initialGameState);
  };

  const votedOutImposter = game.votedOutPlayerId !== null
    ? game.players.find((p) => p.id === game.votedOutPlayerId && p.isImposter)
    : null;

  return (
    <div className="min-h-screen bg-bg-dark text-white stars-bg selection:bg-blue-600/40 flex flex-col">
      <StarField />
      <div className="relative z-10 flex-1">
        {game.phase === "MENU" && (
          <MenuScreen onStart={() => setGame((g) => ({ ...g, phase: "SETUP" }))} />
        )}

        {game.phase === "SETUP" && (
          <SetupScreen onStartGame={startGame} onBack={handleMenu} />
        )}

        {game.phase === "ROLE_REVEAL" && (
          <RoleRevealScreen
            player={game.players[game.currentPlayerIndex]}
            secretWord={game.secretWord}
            category={game.category}
            onNext={handleRoleRevealNext}
            currentIndex={game.currentPlayerIndex}
            totalPlayers={game.players.length}
            nextPlayerName={
              game.currentPlayerIndex < game.players.length - 1
                ? game.players[game.currentPlayerIndex + 1].name
                : undefined
            }
          />
        )}

        {game.phase === "DISCUSSION" && (
          <DiscussionScreen
            players={game.players}
            round={game.round}
            onProceedToVote={() => setGame((g) => ({ ...g, phase: "VOTING" }))}
            onNextRound={handleNextRound}
          />
        )}

        {game.phase === "VOTING" && (
          <VotingScreen
            players={game.players}
            onComplete={handleVoteComplete}
          />
        )}

        {game.phase === "VOTE_RESULTS" && (
          <VoteResultsScreen
            players={game.players}
            votes={new Map(
              game.players
                .filter((p) => !p.isEliminated && p.votedFor !== null)
                .map((p) => [p.id, p.votedFor!])
            )}
            onContinue={handleVoteResultContinue}
          />
        )}

        {game.phase === "IMPOSTER_GUESS" && votedOutImposter && (
          <ImposterGuessScreen
            imposter={votedOutImposter}
            secretWord={game.secretWord}
            category={game.category}
            onGuess={handleImposterGuess}
            onSkip={handleImposterSkipGuess}
          />
        )}

        {game.phase === "GAME_OVER" && game.gameResult && (
          <GameOverScreen
            result={game.gameResult}
            players={game.players}
            secretWord={game.secretWord}
            onPlayAgain={handlePlayAgain}
            onMenu={handleMenu}
          />
        )}
      </div>
      <div className="relative z-10 text-center py-4">
        <p className="text-white/20 text-xs tracking-wider">made for <span className="text-white/30 font-semibold">zgcv2</span></p>
      </div>
    </div>
  );
}
