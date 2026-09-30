import Svg, { Circle, Rect } from 'react-native-svg';

export function Mark({ size = 88 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect x="8" y="8" width="84" height="84" rx="22" fill="#C9B8FF" />
      <Rect x="27" y="28" width="46" height="30" rx="7" fill="#16141C" />
      <Rect x="31" y="32" width="18" height="22" rx="4" fill="#F0B48A" />
      <Rect x="51" y="32" width="18" height="22" rx="4" fill="#8FD4C4" />
      <Rect x="27" y="64" width="46" height="6" rx="3" fill="#16141C" />
      <Circle cx="70" cy="74" r="5" fill="#9EE6C8" />
    </Svg>
  );
}
