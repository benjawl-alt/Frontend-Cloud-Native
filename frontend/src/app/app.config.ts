import { ApplicationConfig, provideAppInitializer } from '@angular/core';
import { provideRouter } from '@angular/router';
// 1. Agregamos HTTP_INTERCEPTORS y withInterceptorsFromDi
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';

import {
  MSAL_INSTANCE,
  MSAL_INTERCEPTOR_CONFIG, // <-- Nuevo
  MsalService,
  MsalGuard,
  MsalBroadcastService,
  MsalInterceptor,         // <-- Nuevo
  MsalInterceptorConfiguration // <-- Nuevo
} from '@azure/msal-angular';

import {
  PublicClientApplication,
  BrowserCacheLocation,
  InteractionType // <-- Nuevo
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

// 2. Creamos la función que configura qué URLs llevarán el token
export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string>>();
  
  // Aquí le decimos que a cualquier petición hacia tu backend le pegue este Scope
  const backendUrl = 'http://localhost:8081/api/';
  const scope = ['api://b3dd3447-de99-4c5a-9cae-cf347f9aa7c2/access_as_user'];
  
  protectedResourceMap.set(backendUrl + '*', scope);

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    
    // 3. Habilitamos los interceptores en Angular
    provideHttpClient(withInterceptorsFromDi()),

    {
      provide: MSAL_INSTANCE,
      useValue: msalInstance
    },
    // 4. Inyectamos la configuración del interceptor que creamos arriba
    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useFactory: MSALInterceptorConfigFactory
    },
    // 5. Inyectamos la clase del interceptor de MSAL
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