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
    redirectUri: 'http://localhost:4200/inicio',
    postLogoutRedirectUri: window.location.origin
  },
  cache: {
    cacheLocation: BrowserCacheLocation.LocalStorage
  }
});

type ScopesEntry = string | { httpMethod: string; scopes: string[] | null };

export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<ScopesEntry> | null>();

  const scopes = ['api://b3dd3447-de99-4c5a-9cae-cf347f9aa7c2/access_as_user'];

  // Pedidos: siempre requieren sesión
  protectedResourceMap.set('http://localhost:8081/api/orders', scopes);
  protectedResourceMap.set('http://localhost:8081/api/orders/*', scopes);

  // Productos: ver el catálogo (GET) es público; crear, editar y borrar requieren sesión
  const soloEscritura: Array<ScopesEntry> = [
    { httpMethod: 'POST', scopes },
    { httpMethod: 'PUT', scopes },
    { httpMethod: 'DELETE', scopes }
  ];
  protectedResourceMap.set('http://localhost:8082/api/products', soloEscritura);
  protectedResourceMap.set('http://localhost:8082/api/products/*', soloEscritura);

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