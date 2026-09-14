import { ApplicationConfig, provideAppInitializer } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';

import {
  MSAL_INSTANCE,
  MSAL_INTERCEPTOR_CONFIG,
  MsalService,
  MsalGuard,
  MsalBroadcastService,
  MsalInterceptor,
  MsalInterceptorConfiguration
} from '@azure/msal-angular';

import {
  PublicClientApplication,
  BrowserCacheLocation,
  InteractionType
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

export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string>>();

  const scope = ['api://b3dd3447-de99-4c5a-9cae-cf347f9aa7c2/access_as_user'];

  // Rutas protegidas para ambos microservicios (8081 y 8082)
  protectedResourceMap.set('http://localhost:8081/api/orders', scope);
  protectedResourceMap.set('http://localhost:8082/api/products', scope);

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),

    provideHttpClient(withInterceptorsFromDi()),

    {
      provide: MSAL_INSTANCE,
      useValue: msalInstance
    },
    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useFactory: MSALInterceptorConfigFactory
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true
    },

    MsalService,
    MsalGuard,
    MsalBroadcastService,

    provideAppInitializer(() => msalInstance.initialize())
  ]
};