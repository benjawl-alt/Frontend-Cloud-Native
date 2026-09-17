import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { AccountInfo } from '@azure/msal-browser';

@Component({
  selector: 'app-mis-pedidos',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './mis-pedidos.html',
  styleUrl: './mis-pedidos.css'
})
export class MisPedidos implements OnInit {
  menuOpen = false;
  user: AccountInfo | null = null;
  userInitial = 'U';
  isAdmin = false;

  // Variables para simular los datos de la vista
  cart: any[] = [];
  historialPedidos: any[] = [];
  totalItemsCarrito = 0;

  constructor(private msalService: MsalService, private router: Router) {}

  ngOnInit(): void {
    let account = this.msalService.instance.getActiveAccount();
    if (!account) {
      const accounts = this.msalService.instance.getAllAccounts();
      if (accounts.length > 0) {
        account = accounts[0];
        this.msalService.instance.setActiveAccount(account);
      }
    }

    if (account) {
      this.user = account;
      const name = account.name || account.username || 'Usuario';
      this.userInitial = name.trim().charAt(0).toUpperCase();

      const claims = account.idTokenClaims as any;
      const roles = claims?.roles || [];
      this.isAdmin = roles.includes('Admin') || roles.includes('Administrator');
    }
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  goToAdmin(): void {
    this.menuOpen = false;
    if (this.isAdmin) this.router.navigate(['/admin']);
  }

  logout(): void {
    this.menuOpen = false;
    this.msalService.logoutRedirect({ postLogoutRedirectUri: window.location.origin });
  }
}