import React from 'react';
import { render } from '@testing-library/react-native';
import LandingScreen from '../app/landing';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    navigate: jest.fn(),
    back: jest.fn(),
  }),
  Stack: { Screen: () => null },
}));

// Mock react-native-mmkv — the sessions/messages stores back the chat list and
// instantiate MMKV at import time, which has no native module under jest.
jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({
    getString: jest.fn(() => undefined),
    set: jest.fn(),
  }),
}));

// Mock useProvider — pulled in transitively by MenuDrawer; the real module loads
// the native keystore, which is unavailable under jest.
jest.mock('@/hooks/useProvider', () => ({
  useProvider: () => ({
    key: { store: { clear: jest.fn() } },
    identity: { store: { clear: jest.fn() } },
    account: { store: { clear: jest.fn() } },
    passkey: { store: { clear: jest.fn() } },
    keys: [],
    identities: [],
    accounts: [],
    passkeys: [],
    sessions: [],
  }),
}));

// Mock MaterialIcons
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}));

// Isolate the chat list under test from heavy presentational wrappers that rely
// on @gorhom/bottom-sheet context (provided at the app root, not in this unit).
jest.mock('@/components/MenuDrawer', () => {
  const ReactModule = require('react');
  return {
    MenuDrawer: ({ children }: { children: React.ReactNode }) =>
      ReactModule.createElement(ReactModule.Fragment, null, children),
  };
});
jest.mock('@/components/ServiceSecretKeyVaultModal', () => ({
  ServiceSecretKeyVaultModal: () => null,
}));

describe('<LandingScreen />', () => {
  it('shows the empty state when there are no connections', () => {
    const { getByText } = render(<LandingScreen />);

    expect(getByText('No chats available yet')).toBeTruthy();
  });
});
