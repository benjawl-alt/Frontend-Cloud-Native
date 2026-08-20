import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Home } from './home/home';

export const routes: Routes = [

  {
    path: 'login',
    component: Login
  },

  {
    path: 'inicio',
    component: Home
  },

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  {
    path: '**',
    redirectTo: 'login'
  }

];