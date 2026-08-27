import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { AccountInfo } from '@azure/msal-browser';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {

  menuOpen = false;

  user: AccountInfo | null = null;

  userInitial = 'U';

  // Indica si el usuario tiene permisos de administrador
  isAdmin = false;

  constructor(
    private msalService: MsalService,
    private router: Router
  ) {}

  ngOnInit(): void {

    let account =
      this.msalService.instance.getActiveAccount();

    if (!account) {

      const accounts =
        this.msalService.instance.getAllAccounts();

      if (accounts.length > 0) {

        account = accounts[0];

        this.msalService.instance.setActiveAccount(account);
      }
    }

    if (account) {

      this.user = account;

      // ==========================================
      // NOMBRE DEL USUARIO
      // ==========================================

      const name =
        account.name ||
        account.username ||
        'Usuario';

      this.userInitial = name
        .trim()
        .charAt(0)
        .toUpperCase();


      // ==========================================
      // COMPROBAR ROL DE ADMINISTRADOR
      // ==========================================

      const claims = account.idTokenClaims as any;

      const roles = claims?.roles || [];

      this.isAdmin =
        roles.includes('Admin') ||
        roles.includes('Administrator') ||
        roles.includes('Administrador');

      console.log('Usuario:', name);
      console.log('Roles:', roles);
      console.log('¿Es administrador?:', this.isAdmin);
    }
  }


  // ==========================================
  // ABRIR/CERRAR MENÚ
  // ==========================================

  toggleMenu(): void {

    this.menuOpen = !this.menuOpen;

  }


  // ==========================================
  // IR AL DASHBOARD
  // ==========================================

  goToAdmin(): void {

    this.menuOpen = false;

    if (this.isAdmin) {

      this.router.navigate(['/admin']);

    }

  }


  // ==========================================
  // CERRAR SESIÓN
  // ==========================================

  logout(): void {

    this.menuOpen = false;

    this.msalService.logoutRedirect({
      postLogoutRedirectUri: window.location.origin
    });

  }

}