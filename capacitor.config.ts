import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.oficinafacil.app',
  appName: 'OficinaFacil',
  webDir: 'build',
  server: {
    androidScheme: 'https'
  }
};

export default config;
