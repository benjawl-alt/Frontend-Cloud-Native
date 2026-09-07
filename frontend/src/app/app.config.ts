import { ApplicationConfig, provideAppInitializer } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import {
  MSAL_INSTANCE,
  MsalService,
  MsalGuard,
  MsalBroadcastService
} from '@azure/msal-angular';

import {
  PublicClientApplication,
  BrowserCacheLocation
} from '@azure/msal-browser';

import { routes } from './app.routes';

const msalInstance = new PublicClientApplication({
  auth: {
    clientId: 'b3dd3447-de99-4c5a-9cae-cf347f9aa7c2',
    authority: 'https://login.microsoftonline.com/6cad67e2-2872-4d7c-9af2-de5251e67986',
    redirectUri: window.location.origin,
postLogoutRedirectUri: window.location.origin
  },

  cache: {
    cacheLocation: BrowserCacheLocation.LocalStorage
  }
});

export const appConfig: ApplicationConfig = {
  providers: [

    provideRouter(routes),

    provideHttpClient(),

    {
      provide: MSAL_INSTANCE,
      useValue: msalInstance
    },

    MsalService,
    MsalGuard,
    MsalBroadcastService,

    provideAppInitializer(() => msalInstance.initialize())
  ]
};