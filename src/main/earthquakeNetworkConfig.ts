/**
 * Defines the public client configuration embedded by the authorized Earthquake Network APK.
 */

import type { Types } from '@eneris/push-receiver/dist/client'

/** Android package identity declared by the Earthquake Network APK. */
export const EARTHQUAKE_NETWORK_PACKAGE_ID = 'com.finazzi.distquake'

/** Firebase client identity read from the APK's generated google-services resources. */
export const EARTHQUAKE_NETWORK_FIREBASE_CONFIG = {
  projectId: 'hybrid-bastion-406',
  appId: '1:899482329945:android:e9ac57970038fe35',
  apiKey: 'AIzaSyAMOdMa4wXMaSE2tFvGNaQGumOgUA10q6s',
  messagingSenderId: '899482329945',
  databaseURL: 'https://hybrid-bastion-406.firebaseio.com',
  storageBucket: 'hybrid-bastion-406.appspot.com',
} satisfies Types.FirebaseConfig

export const EARTHQUAKE_NETWORK_REGISTER_URL =
  'https://srv.earthquakenetwork.it/distquake_upload_gcm_regid2.php'

export const EARTHQUAKE_NETWORK_UPDATE_TILE_URL =
  'https://srv.earthquakenetwork.it/distquake_update_tile.php'
