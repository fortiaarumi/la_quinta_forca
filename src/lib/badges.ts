export interface Badge {
  id: string;
  label: string;
  desc: string;
}

export const ALL_BADGES: Badge[] = [
  { id: "Brúixola d'Or", label: "Brúixola d'Or", desc: "10 partides jugades" },
  { id: "Franctirador", label: "Franctirador", desc: "Un 5k perfecte" },
  { id: "Pubilla/Hereu de la Forca", label: "Pubilla/Hereu de la Forca", desc: "Guanyar a Catalunya" },
  { id: "Llegendari", label: "Llegendari", desc: "50 victòries" },
  { id: "Lofish the goat", label: "Lofish the goat", desc: "Guanya la teva primera partida" },
  { id: "Uri Badia", label: "Uri Badia", desc: "Guanya a estadis" },
];
