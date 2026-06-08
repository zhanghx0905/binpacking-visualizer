const palette = [
  "#3f7cac",
  "#d95d39",
  "#5b8e7d",
  "#c08497",
  "#7768ae",
  "#e0a458",
  "#4f6d7a",
  "#b56576",
  "#6a994e",
  "#577590",
];

export function colorForIndex(index: number): string {
  return palette[index % palette.length];
}
