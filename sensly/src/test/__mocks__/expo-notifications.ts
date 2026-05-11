export const scheduleNotificationAsync = jest.fn().mockResolvedValue('notification-id');
export const requestPermissionsAsync = jest.fn().mockResolvedValue({ status: 'granted' });
export const getPermissionsAsync = jest.fn().mockResolvedValue({ status: 'granted' });
