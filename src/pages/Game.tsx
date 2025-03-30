import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Users } from 'lucide-react';
import { SudokuBoard } from '../components/SudokuBoard';
import { supabase } from '../lib/supabase';

interface Player {
  id: string;
  nickname: string;
  color: string;
}

export function Game() {
  const { gameId } = useParams<{ gameId: string }>();
  const [searchParams] = useSearchParams();
  const playerId = searchParams.get('playerId');
  const navigate = useNavigate();
  const [board, setBoard] = useState<number[][]>([]);
  const [solution, setSolution] = useState<number[][]>([]);
  const [initialBoard, setInitialBoard] = useState<boolean[][]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    if (!gameId) return;

    // Subscribe to real-time changes
    const channel = supabase.channel('public:games')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          console.log('Received update:', payload);
          if (payload.new) {
            if ('board' in payload.new) {
              setBoard(payload.new.board as number[][]);
            }
            if ('players' in payload.new) {
              setPlayers(payload.new.players as Player[]);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    // Fetch initial game state
    const fetchGame = async () => {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (error) {
        console.error('Error fetching game:', error);
        navigate('/');
        return;
      }

      if (data) {
        setBoard(data.board);
        setSolution(data.solution);
        setInitialBoard(data.initial_board);
        setPlayers(data.players || []);
      }
    };

    fetchGame();

    return () => {
      channel.unsubscribe();
    };
  }, [gameId, navigate, playerId]);

  const handleCellChange = async (row: number, col: number, value: number) => {
    if (!initialBoard[row]?.[col] && gameId) {
      const newBoard = JSON.parse(JSON.stringify(board));
      newBoard[row][col] = value;
      
      // Update local state immediately for better responsiveness
      setBoard(newBoard);
      
      const { error } = await supabase
        .from('games')
        .update({ board: newBoard })
        .eq('id', gameId);

      if (error) {
        console.error('Error updating game:', error);
        // Revert local state if update fails
        setBoard(board);
        return;
      }
    }
  };

  const isInitial = (row: number, col: number): boolean => {
    return initialBoard[row]?.[col] ?? false;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-800 flex items-center"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Menu
          </button>
          {gameId && (
            <div className="text-sm text-gray-600">
              Game ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{gameId}</span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Players List */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-800">Players</h3>
              </div>
              <div className="space-y-3">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-gray-50"
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: player.color }}
                    />
                    <span className="text-gray-700">
                      {player.nickname}
                      {player.id === playerId && " (you)"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sudoku Board */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Sudoku Game</h2>
              <div className="flex justify-center">
                <SudokuBoard
                  board={board}
                  onCellChange={handleCellChange}
                  isInitial={isInitial}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}