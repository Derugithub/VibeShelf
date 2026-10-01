import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking } from 'react-native';

function explain(kind: 'library' | 'camera') {
  const title = kind === 'library' ? 'Photo access is off' : 'Camera access is off';
  const body =
    kind === 'library'
      ? 'VibeShelf needs your photo library to add pictures. You can turn it on in Settings. Sample photos still work, and nothing is uploaded.'
      : 'VibeShelf needs the camera to take a photo for your shelf. You can turn it on in Settings. Your pictures stay on this phone.';
  Alert.alert(title, body, [
    { text: 'Not now', style: 'cancel' },
    { text: 'Open Settings', onPress: () => Linking.openSettings() },
  ]);
}

async function ensure(
  get: () => Promise<ImagePicker.PermissionResponse>,
  request: () => Promise<ImagePicker.PermissionResponse>,
  kind: 'library' | 'camera',
): Promise<boolean> {
  try {
    const current = await get();
    if (current.granted) return true;
    if (current.status === 'denied' && current.canAskAgain === false) {
      explain(kind);
      return false;
    }
    const next = await request();
    if (next.granted) return true;
    if (next.canAskAgain === false) explain(kind);
    else {
      Alert.alert(
        kind === 'library' ? 'Photo library unavailable' : 'Camera unavailable',
        'You can still add the sample photos. Pictures you add stay on this phone.',
      );
    }
    return false;
  } catch {
    return true;
  }
}

export function ensureLibraryPermission(): Promise<boolean> {
  return ensure(
    () => ImagePicker.getMediaLibraryPermissionsAsync(),
    () => ImagePicker.requestMediaLibraryPermissionsAsync(),
    'library',
  );
}

export function ensureCameraPermission(): Promise<boolean> {
  return ensure(
    () => ImagePicker.getCameraPermissionsAsync(),
    () => ImagePicker.requestCameraPermissionsAsync(),
    'camera',
  );
}
