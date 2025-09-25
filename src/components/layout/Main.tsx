import React from 'react';
import { Button } from '@/components/ui/Button';
import { MusicalNoteIcon } from '@heroicons/react/24/outline';
import PianoRollPreview from '@/components/PianoRollPreview';

interface MainProps {
  notesCount: number;
  onOpenPianoRoll: () => void;
  children?: React.ReactNode;
}

export function Main({ notesCount, onOpenPianoRoll, children }: MainProps) {
  return (
    <main className="flex-1 bg-gray-900">
      <div className="max-w-7xl mx-auto h-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full p-6">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1 space-y-6">
            {children}
          </div>

          {/* Right Panel - Piano Roll Preview */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-xl p-6 h-full min-h-[400px] shadow-soft">
              {notesCount > 0 ? (
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <MusicalNoteIcon className="w-6 h-6 text-indigo-400" />
                      <div>
                        <h2 className="text-h6 text-white">Piano Roll</h2>
                        <p className="text-body-sm text-gray-400">{notesCount} notes</p>
                      </div>
                    </div>
                    <Button
                      onClick={onOpenPianoRoll}
                      variant="default"
                      size="sm"
                    >
                      Open Editor
                    </Button>
                  </div>
                  
                  {/* Piano Roll Preview Area */}
                  <div className="flex-1 bg-gray-900 rounded-lg border border-gray-800 p-4">
                    <PianoRollPreview />
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center max-w-md">
                    <MusicalNoteIcon className="w-16 h-16 text-gray-600 mx-auto mb-6" />
                    <h3 className="text-h5 text-white mb-3">Your canvas is clear</h3>
                    <p className="text-body text-gray-400 mb-6">
                      Select a key and scale, then click &quot;Generate&quot; to create a new chord progression.
                    </p>
                    <Button
                      onClick={onOpenPianoRoll}
                      variant="outline"
                      size="lg"
                      leftIcon={<MusicalNoteIcon className="w-5 h-5" />}
                    >
                      Start Creating
                    </Button>
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
