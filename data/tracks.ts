export interface Track {
  id: number;
  title: string;
  url: string;
}

export const tracks: Track[] = [
  {
    id: 1,
    title: "Track 1",
    url: "/audio/track-1.mp3",
  },
  {
    id: 2,
    title: "Track 2",
    url: "/audio/track-2.mp3",
  },
  {
    id: 3,
    title: "Track 3",
    url: "/audio/track-3.mp3",
  },
];