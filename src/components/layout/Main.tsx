import React from 'react';
import { Button } from '@/components/ui/Button';
import { MusicalNoteIcon, SparklesIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import PianoRollPreview from '@/components/PianoRollPreview';

interface MainProps {
  notesCount: number;
  onOpenPianoRoll: () => void;
  onSectionClick?: (sectionType: string) => void;
  children?: React.ReactNode;
}

export function Main({ notesCount, onOpenPianoRoll, onSectionClick, children }: MainProps) {
  return (
    <main className="flex-1 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 relative overflow-hidden" role="main">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" aria-hidden="true" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" aria-hidden="true" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-blue-500/3 rounded-full blur-3xl" aria-hidden="true" />
      </div>
      
      <div className="max-w-7xl mx-auto h-full relative z-10">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 h-full p-4 sm:p-6">
          {/* Left Panel - Controls */}
          <div className="xl:col-span-1 space-y-4 sm:space-y-6 animate-slide-in-left">
            {children}
            
            {/* Quick Stats Card */}
            <div className="elevated-card p-4 border border-gray-800/50 bg-gray-800/20 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-body-sm font-medium text-gray-300">Session Stats</h3>
                <ChartBarIcon className="w-4 h-4 text-gray-400" aria-hidden="true" />
              </div>
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div className="text-center">
                  <div className="text-h6 text-white font-semibold" aria-label={`${notesCount} notes`}>{notesCount}</div>
                  <div className="text-caption text-gray-400">Notes</div>
                </div>
                <div className="text-center border-l border-gray-700 pl-3 sm:pl-4">
                  <div className="text-h6 text-white font-semibold">8</div>
                  <div className="text-caption text-gray-400">Bars</div>
                </div>
                <div className="text-center border-l border-gray-700 pl-3 sm:pl-4">
                  <div className="text-h6 text-white font-semibold">4/4</div>
                  <div className="text-caption text-gray-400">Time</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Piano Roll Preview */}
          <div className="xl:col-span-2 animate-slide-in-right">
            <div className="elevated-card p-4 sm:p-6 h-full min-h-[400px] sm:min-h-[500px] border border-gray-800/50 bg-gray-800/30 backdrop-blur-sm relative overflow-hidden">
              {notesCount > 0 ? (
                <div className="h-full flex flex-col">
                  {/* Header with enhanced styling */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                          <MusicalNoteIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-h6 sm:text-h5 text-white font-semibold">Piano Roll</h2>
                          <p className="text-body-sm text-gray-400 flex items-center gap-2">
                            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" aria-hidden="true" />
                            <span>{notesCount} notes • Active composition</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <Button
                        onClick={onOpenPianoRoll}
                        variant="outline"
                        size="sm"
                        className="border-gray-600 hover:border-gray-500 hover:bg-gray-700/50 flex-shrink-0"
                        aria-label="Open full piano roll editor"
                      >
                        <span className="hidden sm:inline">Full </span>Editor
                      </Button>
                      <Button
                        onClick={onOpenPianoRoll}
                        variant="default"
                        size="sm"
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 flex-shrink-0"
                        aria-label="Edit composition"
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                  
                  {/* Piano Roll Preview Area with enhanced styling */}
                  <div className="flex-1 bg-gray-900/80 rounded-xl border border-gray-700/50 p-3 sm:p-6 backdrop-blur-sm relative overflow-hidden">
                    {/* Subtle grid pattern background */}
                    <div className="absolute inset-0 opacity-[0.02]" style={{
                      backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
                      backgroundSize: '20px 20px'
                    }} aria-hidden="true" />
                    <div className="relative">
                      <PianoRollPreview onSectionClick={onSectionClick} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center p-4">
                  <div className="text-center max-w-md animate-scale-in-150">
                    <div className="relative mb-6 sm:mb-8">
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full blur-xl" aria-hidden="true" />
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl">
                        <SparklesIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                      </div>
                    </div>
                    <h3 className="text-h5 sm:text-h4 text-white mb-3 sm:mb-4 font-semibold">Ready to Create</h3>
                    <p className="text-body text-gray-400 mb-6 sm:mb-8 leading-relaxed">
                      Select a key and scale from the controls <span className="hidden sm:inline">on the left</span>, then click <strong className="text-gray-300">Generate</strong> to create an AI-powered chord progression.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button
                        onClick={onOpenPianoRoll}
                        variant="outline"
                        size="lg"
                        leftIcon={<MusicalNoteIcon className="w-5 h-5" />}
                        className="border-gray-600 hover:border-gray-500 hover:bg-gray-700/50"
                        aria-label="Open piano roll editor"
                      >
                        Open Editor
                      </Button>
                      <Button
                        variant="default"
                        size="lg"
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
                        leftIcon={<SparklesIcon className="w-5 h-5" />}
                        aria-label="Get started with MIDI composition"
                      >
                        Get Started
                      </Button>
                    </div>
                    
                    {/* Feature highlights */}
                    <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-center">
                      <div className="group">
                        <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-gray-700 transition-colors">
                          <SparklesIcon className="w-4 h-4 text-indigo-400" aria-hidden="true" />
                        </div>
                        <div className="text-caption text-gray-400">AI Generation</div>
                      </div>
                      <div className="group">
                        <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-gray-700 transition-colors">
                          <MusicalNoteIcon className="w-4 h-4 text-purple-400" aria-hidden="true" />
                        </div>
                        <div className="text-caption text-gray-400">Visual Editing</div>
                      </div>
                      <div className="group">
                        <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-gray-700 transition-colors">
                          <ChartBarIcon className="w-4 h-4 text-green-400" aria-hidden="true" />
                        </div>
                        <div className="text-caption text-gray-400">Export Ready</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
