import React from 'react';
import { ThemeToggle } from './ThemeToggle';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onStartOver?: () => void;
  onResetToLobby?: () => void;
  soundsEnabled?: boolean;
  onToggleSounds?: () => void;
  isInGame?: boolean;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  onStartOver,
  onResetToLobby,
  soundsEnabled,
  onToggleSounds,
  isInGame = false,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-80 glass shadow-glass-dark dark:shadow-black z-50 animate-slide-in-right">
        <div className="h-full flex flex-col p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-theme">
              Settings
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full glass-light hover:glass-heavy transition-all flex items-center justify-center"
              aria-label="Close settings"
            >
              <svg
                className="w-5 h-5 text-slate-600 dark:text-slate-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-6 overflow-y-auto">
            {/* Theme Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 transition-theme">
                Appearance
              </h3>
              <div className="glass-light rounded-2xl p-4 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 transition-theme">
                  Theme
                </span>
                <ThemeToggle />
              </div>
            </div>

            {/* Sound Section */}
            {onToggleSounds && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 transition-theme">
                  Audio
                </h3>
                <button
                  onClick={onToggleSounds}
                  className="w-full glass-light rounded-2xl p-4 flex items-center justify-between hover:glass-heavy transition-all"
                >
                  <span className="text-slate-600 dark:text-slate-400 transition-theme">
                    Sound Effects
                  </span>
                  <div
                    className={`w-12 h-6 rounded-full transition-all ${
                      soundsEnabled
                        ? 'bg-emerald-500'
                        : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-lg transition-transform ${
                        soundsEnabled ? 'translate-x-6' : 'translate-x-0.5'
                      } mt-0.5`}
                    />
                  </div>
                </button>
              </div>
            )}

            {/* Game Actions (when in game) */}
            {isInGame && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 transition-theme">
                  Game Actions
                </h3>

                {onStartOver && (
                  <button
                    onClick={() => {
                      onStartOver();
                      onClose();
                    }}
                    className="w-full glass-light rounded-2xl p-4 text-left hover:glass-heavy transition-all group"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 dark:bg-blue-400/20 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                        <svg
                          className="w-5 h-5 text-blue-600 dark:text-blue-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-100 transition-theme">
                          New Game
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 transition-theme">
                          Same settings
                        </div>
                      </div>
                    </div>
                  </button>
                )}

                {onResetToLobby && (
                  <button
                    onClick={() => {
                      onResetToLobby();
                      onClose();
                    }}
                    className="w-full glass-light rounded-2xl p-4 text-left hover:glass-heavy transition-all group"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-purple-500/20 dark:bg-purple-400/20 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                        <svg
                          className="w-5 h-5 text-purple-600 dark:text-purple-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-100 transition-theme">
                          Change Settings
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 transition-theme">
                          Back to lobby
                        </div>
                      </div>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
            <p className="text-xs text-center text-slate-500 dark:text-slate-400 transition-theme">
              Gaming Hub v1.0
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
