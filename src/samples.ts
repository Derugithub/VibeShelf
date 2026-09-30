export type SampleSource = {
  key: string;
  module: number;
};

export const SAMPLES: SampleSource[] = [
  { key: 'golden-hour', module: require('../assets/samples/golden-hour.jpg') },
  { key: 'tidepool', module: require('../assets/samples/tidepool.jpg') },
  { key: 'night-window', module: require('../assets/samples/night-window.jpg') },
  { key: 'pastel-room', module: require('../assets/samples/pastel-room.jpg') },
  { key: 'market-day', module: require('../assets/samples/market-day.jpg') },
  { key: 'fog-linen', module: require('../assets/samples/fog-linen.jpg') },
];
