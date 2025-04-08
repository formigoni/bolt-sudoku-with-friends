import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Users } from 'lucide-react';
import { SudokuBoard } from '../components/SudokuBoard';
import { VirtualKeyboard } from '../components/VirtualKeyboard';
import { supabase } from '../lib/supabase';

interface Player {
  id: string;
  nickname: string;
  color: string;
  selectedCell?: { row: number; col: number } | null;
}

interface CellCandidates {
  [key: string]: Set<number>; // Using row-col as key
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
  const [candidates, setCandidates] = useState<CellCandidates>({});
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);

  const currentPlayer = players.find(player => player.id === playerId);

  useEffect(() => {
    if (!gameId) return;

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
      
      setBoard(newBoard);

      const updatedPlayers = players.map(player => 
        player.id === playerId
          ? { ...player, selectedCell: { row, col } }
          : player
      );
      
      const { error } = await supabase
        .from('games')
        .update({
          board: newBoard,
          players: updatedPlayers
        })
        .eq('id', gameId);

      if (error) {
        console.error('Error updating game:', error);
        setBoard(board);
        setPlayers(players);
        return;
      }
    }
  };

  const isInitial = (row: number, col: number): boolean => {
    return initialBoard[row]?.[col] ?? false;
  };

  const handleNumberClick = (number: number) => {
    if (selectedCell) {
      const { row, col } = selectedCell;
      if (!isInitial(row, col)) {
        handleCellChange(row, col, number);
      }
    }
  };

  const getCandidates = (row: number, col: number): Set<number> => {
    return candidates[getCellKey(row, col)] || new Set();
  };

  const getCellKey = (row: number, col: number) => `${row}-${col}`;

  const toggleCandidate = async(row: number, col: number, candidate: number) => {
    if (board[row][col] !== 0 || isInitial(row, col)) return;

    const cellKey = getCellKey(row, col);
    const currentCandidates = new Set(candidates[cellKey] || new Set());
    const newCandidates = { ...candidates };

    if (currentCandidates.has(candidate)) {
      currentCandidates.delete(candidate);
    } else {
      currentCandidates.add(candidate);
    }

    newCandidates[cellKey] = currentCandidates;
    setCandidates(newCandidates);

/*    setCandidates(prev => ({
      ...prev,
      [cellKey]: currentCandidates
    }));
*/
    const { error } = await supabase
      .from('games')
      .update({
        candidates: candidates
      })
      .eq('id', gameId);

    if (error) {
      console.error('Error updating candidates:', error);
      setCandidates(candidates);
      return;
    }

  };

  const handleClear = () => {
    if (selectedCell) {
      const { row, col } = selectedCell;
      if (!isInitial(row, col)) {
        handleCellChange(row, col, 0);
      }
    }
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
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-6">
          {/* Players List */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-2 md:p-6">
              <div className="flex items-center gap-2 mb-2 md:mb-4">
                <Users className="h-5 w-5 text-indigo-600 shrink-0" />
                <h3 className="text-lg font-semibold text-gray-800">Players</h3>
                <div className="md:hidden flex-1">
                  <div className="flex gap-2 overflow-x-auto pl-2">
                    {players.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 whitespace-nowrap shrink-0"
                      >
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: player.color }}
                        />
                        <span className="text-gray-700 text-sm">
                          {player.nickname}
                          {player.id === playerId && " (you)"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="hidden md:block space-y-3">
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

              {/* Virtual Keyboards for MD+ screens */}
              <div className="hidden md:block space-y-6 mt-6">
                <VirtualKeyboard
                  onNumberClick={handleNumberClick}
                  onClear={handleClear}
                  label="Enter Number"
                  variant="primary"
                />
                <VirtualKeyboard
                  onNumberClick={(number) => {
                    // Handle candidate number
                    console.log('Candidate:', number);
                  }}
                  onClear={() => {
                    // Handle clear candidates
                    console.log('Clear candidates');
                  }}
                  label="Enter Candidate"
                  variant="secondary"
                />
              </div>
            </div>
          </div>

          {/* Sudoku Board */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
              <h2 className="hidden md:block text-2xl font-bold text-gray-800 mb-6 text-center">Sudoku Game</h2>
              <div className="flex justify-center">
                <SudokuBoard
                  board={board}
                  onCellChange={handleCellChange}
                  isInitial={isInitial}
                  getCandidates={getCandidates}
                  toggleCandidate={toggleCandidate}
                  playerColor={currentPlayer?.color}
                />
              </div>

              {/* Virtual Keyboards for mobile */}
              <div className="md:hidden space-y-4 mt-6">
                <VirtualKeyboard
                  onNumberClick={handleNumberClick}
                  onClear={handleClear}
                  label="Enter Number"
                  variant="primary"
                />
                <VirtualKeyboard
                  onNumberClick={(number) => {
                    // Handle candidate number
                    console.log('Candidate:', number);
                  }}
                  onClear={() => {
                    // Handle clear candidates
                    console.log('Clear candidates');
                  }}
                  label="Enter Candidate"
                  variant="secondary"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}