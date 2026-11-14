// index.js
import { registerRootComponent } from 'expo';
import App from './App';

// Widget task handler — sonraki sürümde aktif edilecek
/*
try {
  // eslint-disable-next-line global-require
  require('./widget-task-handler');
} catch (e) {
  if (__DEV__) {
    console.log('[index] Widget handler yüklenemedi:', e?.message);
  }
}
*/

registerRootComponent(App);