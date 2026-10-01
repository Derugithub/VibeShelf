import type { ColorValue } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

type IconName =
  | 'library'
  | 'boards'
  | 'camera'
  | 'image'
  | 'plus'
  | 'back'
  | 'close'
  | 'share'
  | 'trash'
  | 'edit'
  | 'up'
  | 'down'
  | 'info'
  | 'check';

export function Icon({
  name,
  color,
  size = 22,
}: {
  name: IconName;
  color: ColorValue;
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
  };
  const ink = color as string;
  const stroke = {
    stroke: ink,
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (name) {
    case 'library':
      return (
        <Svg {...common}>
          <Rect x="3.5" y="3.5" width="7" height="7" rx="2" {...stroke} />
          <Rect x="13.5" y="3.5" width="7" height="7" rx="2" {...stroke} />
          <Rect x="3.5" y="13.5" width="7" height="7" rx="2" {...stroke} />
          <Rect x="13.5" y="13.5" width="7" height="7" rx="2" {...stroke} />
        </Svg>
      );
    case 'boards':
      return (
        <Svg {...common}>
          <Rect x="7" y="7" width="13" height="13" rx="2.5" {...stroke} />
          <Path d="M5 16.5V6.5A2.5 2.5 0 0 1 7.5 4H16" {...stroke} />
        </Svg>
      );
    case 'camera':
      return (
        <Svg {...common}>
          <Path d="M8 7.5 9.2 5.5h5.6L16 7.5h2.2A1.8 1.8 0 0 1 20 9.3v8.2a1.8 1.8 0 0 1-1.8 1.8H5.8A1.8 1.8 0 0 1 4 17.5V9.3A1.8 1.8 0 0 1 5.8 7.5H8Z" {...stroke} />
          <Circle cx="12" cy="13" r="3" {...stroke} />
        </Svg>
      );
    case 'image':
      return (
        <Svg {...common}>
          <Rect x="4" y="5" width="16" height="14" rx="2.5" {...stroke} />
          <Circle cx="9" cy="10" r="1.2" fill={ink} />
          <Path d="m7 16 3.2-3.2a1 1 0 0 1 1.4 0L16 17" {...stroke} />
        </Svg>
      );
    case 'plus':
      return (
        <Svg {...common}>
          <Path d="M12 5.5v13M5.5 12h13" {...stroke} />
        </Svg>
      );
    case 'back':
      return (
        <Svg {...common}>
          <Path d="M14.5 5.5 8 12l6.5 6.5" {...stroke} />
        </Svg>
      );
    case 'close':
      return (
        <Svg {...common}>
          <Path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5" {...stroke} />
        </Svg>
      );
    case 'share':
      return (
        <Svg {...common}>
          <Path d="M12 14.5V4.5M8.5 8 12 4.5 15.5 8" {...stroke} />
          <Path d="M6 12.5v5.2A1.8 1.8 0 0 0 7.8 19.5h8.4a1.8 1.8 0 0 0 1.8-1.8v-5.2" {...stroke} />
        </Svg>
      );
    case 'trash':
      return (
        <Svg {...common}>
          <Path d="M5 7.5h14M9.5 7.5V5.8A1.3 1.3 0 0 1 10.8 4.5h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7M8 7.5l.7 11a1.5 1.5 0 0 0 1.5 1.4h3.6a1.5 1.5 0 0 0 1.5-1.4l.7-11" {...stroke} />
        </Svg>
      );
    case 'edit':
      return (
        <Svg {...common}>
          <Path d="M13.2 6.2 17.8 10.8 9.5 19.1H5v-4.6L13.2 6.2Z" {...stroke} />
          <Path d="m11.6 7.8 4.6 4.6" {...stroke} />
        </Svg>
      );
    case 'up':
      return (
        <Svg {...common}>
          <Path d="M6 14.5 12 8.5l6 6" {...stroke} />
        </Svg>
      );
    case 'down':
      return (
        <Svg {...common}>
          <Path d="m6 9.5 6 6 6-6" {...stroke} />
        </Svg>
      );
    case 'info':
      return (
        <Svg {...common}>
          <Circle cx="12" cy="12" r="8" {...stroke} />
          <Path d="M12 11v5" {...stroke} />
          <Circle cx="12" cy="8.2" r="0.8" fill={ink} />
        </Svg>
      );
    case 'check':
      return (
        <Svg {...common}>
          <Path d="m5.5 12.5 4.2 4.2 8.8-9.2" {...stroke} />
        </Svg>
      );
    default:
      return null;
  }
}
