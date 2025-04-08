import React, { useState } from 'react';
import { Users, Plus, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { generateSudoku } from '../utils/sudoku';

const COLORS = [
  { name: 'yellow', hex: '#FFD700' },
  { name: 'blue', hex: '#4169E1' },
  { name: 'red', hex: '#FF4136' },
  { name: 'green', hex: '#2ECC40' },
  { name: 'orange', hex: '#FF851B' },
  { name: 'purple', hex: '#B10DC9' },
  { name: 'pink', hex: '#FF69B4' },
  { name: 'gold', hex: '#DAA520' }
];

export function Home() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[Math.floor(Math.random() * 8)]);
  const [gameIdInput, setGameIdInput] = useState('');
  const [initialState, setInitialState] = useState('');

  const parseInitialState = (input: string): number[][] | null => {
    // Remove any whitespace and newlines
    const cleanInput = input.replace(/\s/g, '');
    
    // If input is not exactly 81 characters, return null
    if (cleanInput.length !== 81) return null;
    
    const board: number[][] = [];
    for (let i = 0; i < 9; i++) {
      const row: number[] = [];
      for (let j = 0; j < 9; j++) {
        const char = cleanInput[i * 9 + j];
        // Convert character to number, any non-digit or 0 becomes 0
        const num = /[1-9]/.test(char) ? parseInt(char, 10) : 0;
        row.push(num);
      }
      board.push(row);
    }
    return board;
  };

  const handleCreateGame = async () => {
    if (!nickname) {
      alert('Please enter a nickname');
      return;
    }

    let puzzle: number[][];
    let solution: number[][];
    
    const parsedState = parseInitialState(initialState);
    
    if (parsedState && initialState.trim() !== '') {
      puzzle = parsedState;
      solution = parsedState; // In this case, the solution is the same as the initial state
    } else {
      const generated = generateSudoku();
      puzzle = generated.puzzle;
      solution = generated.solution;
    }

    const newGameId = uuidv4();
    const playerId = uuidv4();
    
    const { error } = await supabase
      .from('games')
      .insert({
        id: newGameId,
        board: puzzle,
        solution: solution,
        initial_board: puzzle.map(row => row.map(cell => cell !== 0)),
        status: 'waiting',
        players: [{
          id: playerId,
          nickname,
          color: selectedColor.hex
        }]
      });

    if (error) {
      console.error('Error creating game:', error);
      return;
    }

    navigate(`/game/${newGameId}?playerId=${playerId}`);
  };

  const handleJoinGame = async (gameId: string) => {
    if (!nickname) {
      alert('Please enter a nickname');
      return;
    }

    if (gameId) {
      const playerId = uuidv4();
      
      // Get current players
      const { data: gameData, error: fetchError } = await supabase
        .from('games')
        .select('players')
        .eq('id', gameId)
        .single();

      if (fetchError) {
        console.error('Error fetching game:', fetchError);
        return;
      }

      const currentPlayers = gameData?.players || [];
      
      // Add new player
      const { error: updateError } = await supabase
        .from('games')
        .update({
          players: [...currentPlayers, {
            id: playerId,
            nickname,
            color: selectedColor.hex
          }]
        })
        .eq('id', gameId);

      if (updateError) {
        console.error('Error joining game:', updateError);
        return;
      }

      navigate(`/game/${gameId}?playerId=${playerId}`);
    }
  };

  const handleInitialStateChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.replace(/[^0-9.\n]/g, ''); // Only allow numbers, dots, and newlines
    
    // Remove all whitespace and newlines to check length
    const cleanValue = value.replace(/[\s\n]/g, '');
    setInitialState(cleanValue);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Users className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Sudoku with Friends</h1>
          <p className="text-indigo-100">Play Sudoku together in real-time</p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white bg-opacity-20 p-6 rounded-lg space-y-4">
              <input
                type="text"
                placeholder="Enter your nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full bg-white text-gray-800 placeholder-gray-500 py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              />
              
              <div>
                <label className="block text-white mb-2">Choose your color:</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        selectedColor.name === color.name ? 'scale-125 ring-2 ring-white' : ''
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-white bg-opacity-20 p-6 rounded-lg">
              <label className="block text-white mb-2">Initial Sudoku State (optional):</label>
              <textarea
                value={initialState}
                onChange={handleInitialStateChange}
                placeholder="Enter Sudoku initial state"
                className="w-full bg-white bg-opacity-20 text-white font-mono text-lg leading-tight placeholder-indigo-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                style={{
                  resize: 'none',
                  letterSpacing: '0.4em',
                  lineHeight: '1.2em'
                }}
              />
              <p className="text-indigo-200 text-sm mt-2">
                {initialState.replace(/[\s\n]/g, '').length}/81 characters. Use numbers 1-9 for filled cells. 0 or . for empty cells.
              </p>
            </div>
          </div>

            <button
              onClick={handleCreateGame}
              className="w-full bg-white hover:bg-indigo-50 text-indigo-600 font-semibold py-3 px-6 rounded-lg shadow-md transition duration-200 ease-in-out flex items-center justify-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Create New Game</span>
            </button>

            <div className="relative">
              <input
                type="text"
                placeholder="Enter Game ID"
                value={gameIdInput}
                onChange={(e) => setGameIdInput(e.target.value)}
                className="w-full bg-white bg-opacity-20 text-white placeholder-indigo-200 py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              />
              <button
                onClick={() => handleJoinGame(gameIdInput)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-indigo-200 hover:text-white"
              >
                <LogIn className="h-5 w-5" />
              </button>
            </div>
          </div>



        <p className="text-center mt-8 text-indigo-100 text-sm">
          Create a new game or join an existing one to start playing
        </p>
      </div>
    </div>
  );
}