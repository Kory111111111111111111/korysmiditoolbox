import { GoogleGenerativeAI } from '@google/generative-ai';
import { MidiNote, RootNote, ScaleType } from '@/types';

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor(apiKey: string) {
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async generateChordProgression(
    rootNote: RootNote,
    scaleType: ScaleType,
    chordCount: number = 4
  ): Promise<MidiNote[]> {
    if (!this.genAI) {
      throw new Error('API key not provided');
    }

    const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Generate a ${chordCount}-chord progression in ${rootNote} ${scaleType}. 
    
    Return it as a JSON array of objects. Each object should represent a MIDI note and have these keys:
    - 'pitch': MIDI note number (0-127)
    - 'startTime': start time in seconds
    - 'duration': duration in seconds  
    - 'velocity': velocity (0-1)
    
    Use common chord progressions for ${rootNote} ${scaleType}. Each chord should last 2 seconds and start at 0, 2, 4, 6 seconds respectively. Include 3-4 notes per chord (root, third, fifth, optionally seventh). Use MIDI note numbers in the 3rd-5th octave range (36-84).
    
    Return only the JSON array, no other text.`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Clean the response to extract JSON
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      
      const notes = JSON.parse(jsonMatch[0]);
      
      // Validate and add IDs to the notes
      return notes.map((note: Record<string, unknown>, index: number) => ({
        id: `generated-${Date.now()}-${index}`,
        pitch: Math.max(0, Math.min(127, Number(note.pitch) || 60)),
        startTime: Number(note.startTime) || 0,
        duration: Number(note.duration) || 2,
        velocity: Math.max(0, Math.min(1, Number(note.velocity) || 0.8))
      }));
    } catch (error) {
      console.error('Error generating chord progression:', error);
      throw new Error('Failed to generate chord progression. Please check your API key and try again.');
    }
  }

  updateApiKey(apiKey: string) {
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    } else {
      this.genAI = null;
    }
  }
}
