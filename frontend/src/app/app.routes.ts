import { Routes } from '@angular/router';

import { Login } from './login/login';
import { Home } from './home/home';
import { Admin } from './admin/admin';

export const routes: Routes = [

  // LOGIN
  {
    path: 'login',
    component: Login
  },

  // HOME / INICIO
  {
    path: 'inicio',
    component: Home
  },

  // DASHBOARD ADMINISTRADOR
  {
    path: 'admin',
    component: Admin
  },

  // RUTA PRINCIPAL
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  // CUALQUIER RUTA QUE NO EXISTA
  {
    path: '**',
    redirectTo: 'login'
  }

];