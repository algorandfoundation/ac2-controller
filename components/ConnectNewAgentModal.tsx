import { useProvider } from '@/hooks/useProvider';
import { MaterialIcons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface ConnectNewAgentModalHandle {
  open: () => void;
  close: () => void;
}

function isValidURL(urlString: string) {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}

export const ConnectNewAgentModal = forwardRef<
  ConnectNewAgentModalHandle,
  { children?: React.ReactNode }
>(function ConnectNewAgentModal(_props, ref) {
  const modalRef = useRef<BottomSheetModal>(null);
  const router = useRouter();
  const { accounts } = useProvider();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useImperativeHandle(ref, () => ({
    open: () => {
      setScanned(false);
      modalRef.current?.present();
    },
    close: () => {
      modalRef.current?.dismiss();
    },
  }));

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleBarcodeScanned = async (scanningResult: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    let { data } = scanningResult;

    const lowerData = data.toLowerCase();
    // Support fido: and liquid: deeplinks
    if (lowerData.startsWith('fido:')) {
      try {
        Alert.alert(
          'FIDO Link',
          'FIDO links are not supported in this modal. Please use the main Scan screen.',
          [{ text: 'OK' }],
        );
        modalRef.current?.dismiss();
      } catch {
        Alert.alert('Error', 'Could not process FIDO link');
        modalRef.current?.dismiss();
      }
      return;
    }

    if (!lowerData.startsWith('liquid:')) {
      Alert.alert('Error', 'Unsupported QR code. Only liquid: links are supported.');
      setScanned(false);
      return;
    }

    // Handle liquid: links
    let processedData = data;
    if (lowerData.startsWith('liquid://')) {
      processedData = 'https://' + data.substring(9);
    } else if (lowerData.startsWith('liquid:')) {
      processedData = 'https://' + data.substring(7);
    }

    if (isValidURL(processedData)) {
      if (accounts.length === 0) {
        Alert.alert('Error', 'No accounts found. Please create or import an account first.');
        modalRef.current?.dismiss();
        return;
      }

      const url = new URL(processedData);
      console.log('URL detected:', processedData);
      console.log('URL host:', url.host);

      // Extract requestId from query parameter or pathname
      let requestId = url.searchParams.get('requestId');
      let pathname = url.pathname;

      if (!requestId && pathname && pathname !== '/') {
        // Handle liquid://<host>/<requestId> case
        const segments = pathname.split('/').filter(Boolean);
        if (segments.length === 1) {
          requestId = segments[0];
          pathname = '/'; // Clear it from origin
        }
      }

      if (!requestId) {
        Alert.alert('Error', 'Invalid QR code: missing requestId');
        setScanned(false);
        return;
      }

      let origin = `${url.protocol}//${url.host}`;
      if (pathname && pathname !== '/') {
        origin += pathname;
      }

      modalRef.current?.dismiss();
      router.push({
        pathname: '/chat',
        params: { origin, requestId },
      });
      return;
    }

    Alert.alert('Error', 'Invalid liquid link format.');
    setScanned(false);
  };

  if (!permission) {
    return (
      <BottomSheetModal
        ref={modalRef}
        snapPoints={['90%']}
        backgroundStyle={{ backgroundColor: '#1e1e1e' }}
      >
        <View style={styles.container}>
          <Text style={styles.message}>Loading camera...</Text>
        </View>
      </BottomSheetModal>
    );
  }

  if (!permission.granted) {
    return (
      <BottomSheetModal
        ref={modalRef}
        snapPoints={['90%']}
        backgroundStyle={{ backgroundColor: '#1e1e1e' }}
      >
        <View style={styles.container}>
          <Text style={styles.message}>We need your permission to show the camera</Text>
          <TouchableOpacity onPress={requestPermission} style={styles.button}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetModal>
    );
  }

  return (
    <BottomSheetModal
      ref={modalRef}
      snapPoints={['90%']}
      backgroundStyle={{ backgroundColor: '#000000' }}
      handleIndicatorStyle={{ backgroundColor: '#555' }}
    >
      <View style={styles.modalContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        >
          <View style={styles.overlay}>
            <View style={styles.header}>
              <Text style={styles.title}>Scan Liquid Auth QR Code</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => modalRef.current?.dismiss()}
              >
                <MaterialIcons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
            <View style={styles.scanAreaContainer}>
              <View style={styles.scanArea} />
              <Text style={styles.scanText}>Align QR code within the frame</Text>
            </View>
          </View>
        </CameraView>
      </View>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    padding: 20,
  },
  camera: {
    flex: 1,
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: 'white',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'space-between',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    padding: 8,
    marginRight: -8,
  },
  scanAreaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#3B82F6',
    backgroundColor: 'transparent',
    borderRadius: 20,
  },
  scanText: {
    color: 'white',
    marginTop: 20,
    fontSize: 16,
    fontWeight: '500',
  },
});
