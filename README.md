# Korys MIDI Toolbox

A modern web application for generating, editing, and exporting MIDI chord progressions. Built as a ChordChord clone with a focus on static site deployment.

## Features

- **AI-Powered Generation**: Generate chord progressions using Google Gemini API
- **Interactive Piano Roll**: Visual MIDI editor with drag-and-drop note editing
- **Real-time Audio Playback**: Play your compositions using Tone.js
- **Export Options**: Export as MIDI (.mid) or WAV (.wav) files
- **Persistent Storage**: All work is automatically saved to browser localStorage
- **Dark/Light Theme**: Toggle between themes with persistent preference
- **Responsive Design**: Works on desktop and tablet devices

## Tech Stack

- **Framework**: Next.js 15 with static site export
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS with dark mode support
- **MIDI Generation**: Google Gemini API
- **Audio Processing**: Tone.js for playback and synthesis
- **MIDI Export**: midi-writer-js for MIDI file generation
- **State Management**: React Context API with localStorage persistence

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Google Gemini API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd korysmiditoolbox
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

To build the static site for deployment:

```bash
npm run build
```

The built files will be in the `out/` directory, ready for static hosting.

## Usage

### Setting Up Your API Key

1. Click the settings gear icon in the top-right corner
2. Enter your Google Gemini API key in the settings panel
3. Click "Save API Key"

### Generating Chord Progressions

1. Select your desired root note and scale type from the dropdowns
2. Click the "Generate" button
3. The AI will create a 4-chord progression in your selected key

### Editing Notes

- **Add Notes**: Double-click on empty space in the piano roll
- **Move Notes**: Click and drag notes horizontally (time) or vertically (pitch)
- **Resize Notes**: Drag the edges of notes to change their duration
- **Delete Notes**: Select a note and press Delete or Backspace
- **Adjust Velocity**: Notes become more opaque with higher velocity

### Exporting

- **Export MIDI**: Click Export → Export MIDI to download a .mid file
- **Export WAV**: Click Export → Export WAV to download a .wav file

## Project Structure

```
src/
├── components/          # React components
│   ├── ControlBar.tsx   # Top control panel
│   ├── PianoRoll.tsx    # Main piano roll editor
│   └── SettingsPanel.tsx # Settings modal
├── context/             # React context for state management
│   └── AppContext.tsx   # Global app state
├── services/            # External service integrations
│   ├── audioService.ts  # Tone.js audio handling
│   ├── geminiService.ts # Google Gemini API
│   └── midiExportService.ts # MIDI file export
├── types/               # TypeScript type definitions
│   └── index.ts         # App-wide types
├── utils/               # Utility functions
│   ├── defaultProgression.ts # Default chord progression
│   └── midiUtils.ts     # MIDI helper functions
└── pages/               # Next.js pages
    ├── _app.tsx         # App wrapper
    └── index.tsx        # Main application page
```

## Deployment

This application is configured for static site deployment. You can deploy it to:

- **GitHub Pages**: Push the `out/` directory to a gh-pages branch
- **Netlify**: Connect your repository and set build command to `npm run build`
- **Vercel**: Import your repository and deploy
- **Any static hosting service**: Upload the contents of the `out/` directory

## API Key Security

Your Google Gemini API key is stored securely in your browser's localStorage and is never sent to our servers. The key is only used to make direct requests to Google's API from your browser.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Commit your changes: `git commit -m 'Add feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by ChordChord for the concept and user experience
- Built with modern web technologies for optimal performance
- Uses Google Gemini API for AI-powered music generation