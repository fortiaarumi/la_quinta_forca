export interface Badge {
  id: string;
  label: string;
  desc: string;
  totalGoal?: number;
  field?: string;
}

export const ALL_BADGES: Badge[] = [
  { id: "Brúixola d'Or", label: "Brúixola d'Or", desc: "10 partides jugades", totalGoal: 10, field: 'totalGames' },
  { id: "Franctirador", label: "Franctirador", desc: "Un 5k perfecte" },
  { id: "Catalayudd", label: "Catalayudd", desc: "Guanyar a Catalunya" },
  { id: "Llegendari", label: "Llegendari", desc: "50 victòries", totalGoal: 50, field: 'totalWins' },
  { id: "Lofish the goat", label: "Lofish the goat", desc: "Guanyar la teva primera partida", totalGoal: 1, field: 'totalWins' },
  { id: "Uri Badia", label: "Uri Badia", desc: "Guanyar a Estadis" },
  { id: "Rocha", label: "Rocha", desc: "Guanyar un Battle Royale de més de 8 jugadors" },
  { id: "Duel Joan", label: "Duel Joan", desc: "15 victòries en 1vs1", totalGoal: 15, field: 'totalWins1vs1' },
  { id: "Pausu", label: "Pausu", desc: "Guanyar al mode Cultura" },
  { id: "Muniani", label: "Muniani", desc: "Revelar 500 pistes", totalGoal: 500, field: 'hintsRevealed' },
];