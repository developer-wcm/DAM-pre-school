import { renderHook } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { usePushNotifications } from '../usePushNotifications';

jest.mock('expo-constants', () => ({
  appOwnership: 'standalone',
}));

jest.mock('expo-device', () => ({
  isDevice: true,
}));

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      upsert: jest.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'fake-token' }),
  getLastNotificationResponseAsync: jest.fn().mockResolvedValue(null),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  AndroidImportance: { MAX: 5 },
}));

function makeResponse(data: Record<string, unknown>) {
  return { notification: { request: { content: { data } } } } as Notifications.NotificationResponse;
}

async function renderAndGetResponseHandler(userId: string, role: string, push: jest.Mock) {
  (useRouter as jest.Mock).mockReturnValue({ push });
  const { unmount } = renderHook(() => usePushNotifications(userId, role, 'school1'));
  // flush the getExpoPushToken / getLastNotificationResponseAsync promise chains
  await Promise.resolve();
  await Promise.resolve();
  const handler = (Notifications.addNotificationResponseReceivedListener as jest.Mock).mock
    .calls.at(-1)[0];
  return { handler, unmount };
}

describe('usePushNotifications navigation on tap', () => {
  afterEach(() => jest.clearAllMocks());

  it('routes admin to a specific student profile', async () => {
    const push = jest.fn();
    const { handler } = await renderAndGetResponseHandler('u1', 'admin', push);
    handler(makeResponse({ screen: 'students', studentId: 's1' }));
    expect(push).toHaveBeenCalledWith('/(dashboard)/student-profile?id=s1');
  });

  it('routes admin to the students list when no studentId is present', async () => {
    const push = jest.fn();
    const { handler } = await renderAndGetResponseHandler('u1', 'admin', push);
    handler(makeResponse({ screen: 'students' }));
    expect(push).toHaveBeenCalledWith('/(dashboard)/students');
  });

  it('routes teacher to their tab group for a student notification', async () => {
    const push = jest.fn();
    const { handler } = await renderAndGetResponseHandler('u1', 'teacher', push);
    handler(makeResponse({ screen: 'students', studentId: 's1' }));
    expect(push).toHaveBeenCalledWith('/(teacher)');
  });

  it('routes each role to their own attendance screen', async () => {
    const cases: [string, string][] = [
      ['admin', '/(dashboard)/attendance'],
      ['teacher', '/(teacher)/attendance'],
      ['parent', '/(parent)/academic'],
    ];
    for (const [role, expected] of cases) {
      const push = jest.fn();
      const { handler } = await renderAndGetResponseHandler('u1', role, push);
      handler(makeResponse({ screen: 'attendance' }));
      expect(push).toHaveBeenCalledWith(expected);
    }
  });

  it('routes each role to their own fees screen', async () => {
    const cases: [string, string][] = [
      ['admin', '/(dashboard)/outstanding-fees'],
      ['parent', '/(parent)/fees'],
    ];
    for (const [role, expected] of cases) {
      const push = jest.fn();
      const { handler } = await renderAndGetResponseHandler('u1', role, push);
      handler(makeResponse({ screen: 'fees' }));
      expect(push).toHaveBeenCalledWith(expected);
    }
  });

  it('navigates on a cold start when a notification launched the app', async () => {
    (Notifications.getLastNotificationResponseAsync as jest.Mock).mockResolvedValueOnce(
      makeResponse({ screen: 'fees' })
    );
    const push = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push });
    renderHook(() => usePushNotifications('u1', 'parent', 'school1'));
    await Promise.resolve();
    await Promise.resolve();
    expect(push).toHaveBeenCalledWith('/(parent)/fees');
  });
});
