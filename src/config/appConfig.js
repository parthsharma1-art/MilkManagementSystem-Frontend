/**
 * Application Configuration
 * Holds global application properties and S3 APK download link.
 * Can be updated via environment variable VITE_APK_DOWNLOAD_URL without modifying source code.
 */
export const APP_CONFIG = {
  // AWS S3 hosted APK URL
  APK_DOWNLOAD_URL:
    import.meta.env.VITE_APK_DOWNLOAD_URL ||
    'https://milk-management-images.s3.eu-north-1.amazonaws.com/apk/MilkManagementSystem.apk',
  APK_FILENAME: 'MilkManagementSystem.apk',
  APK_VERSION: '1.0.0',
}

