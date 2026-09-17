import { Routes } from '@angular/router';

import { Login } from './login/login';
import { Home } from './home/home';
import { Admin } from './admin/admin';
import { Productos } from './productos/productos';
import { MisPedidos } from './mis-pedidos/mis-pedidos';

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
    path: 'productos',
    component: Productos
  },

  {
    path: 'admin',
    component: Admin
  },
  {
    path: 'inicio',
    component: Home
  },
  {
    path: 'mis-pedidos',
    component: MisPedidos
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