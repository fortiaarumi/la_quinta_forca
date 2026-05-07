export interface Badge {
  id: string;
  label: string;
  desc: string;
  totalGoal?: number;
  field?: string;
  image: string;
}

export const ALL_BADGES: Badge[] = [
  { id: "Vinicius Blanc", label: "Vinicius Blanc", desc: "10 partides jugades", totalGoal: 10, field: 'totalGames', image: '/badges/viniciusblanc.jpeg' },
  { id: "Franctirador", label: "Franctirador", desc: "Un 5k perfecte", image: '/badges/franctirador.jpeg' },
  { id: "Catalayudd", label: "Catalayudd", desc: "Guanyar a Catalunya", image: '/badges/catalayudd.jpeg' },
  { id: "Vinicius Butanero", label: "Vinicius Butanero", desc: "50 victòries", totalGoal: 50, field: 'totalWins', image: '/badges/viniciusbutanero.jpeg' },
  { id: "Lofish the goat", label: "Lofish the goat", desc: "Guanyar la teva primera partida", totalGoal: 1, field: 'totalWins', image: '/badges/lofish.jpeg' },
  { id: "Uri Badia", label: "Uri Badia", desc: "Guanyar a Estadis", image: '/badges/uribadia.jpeg' },
  { id: "Rocha", label: "Rocha", desc: "Guanyar un Battle Royale de més de 8 jugadors", image: '/badges/rocha.jpeg' },
  { id: "Duel Joan", label: "Duel Joan", desc: "15 victòries en 1vs1", totalGoal: 15, field: 'totalWins1vs1', image: '/badges/dueljoan.jpeg' },
  { id: "Pausu", label: "Pausu", desc: "Guanyar al mode Cultura", image: '/badges/pausu.jpeg' },
  { id: "Muniani", label: "Muniani", desc: "Revelar 500 pistes", totalGoal: 500, field: 'hintsRevealed', image: '/badges/muniani.jpeg' },
  { id: "David Txuc", label: "David Txuc", desc: "Jugar a tots els modes i temps", image: '/badges/davidtxuc.jpeg' },
  { id: "Humiliació", label: "Humiliació", desc: "Quedar últim a un Battle Royale de més de 8 jugadors", image: '/badges/humiliacio.jpeg' },
];