import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { AccountInfo } from '@azure/msal-browser';
import { Subscription } from 'rxjs';
import { CartService, CartItem, ConfirmedOrder } from '../cart.service';

@Component({
  selector: 'app-mis-pedidos',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './mis-pedidos.html',
  styleUrl: './mis-pedidos.css'
})
export class MisPedidos implements OnInit, OnDestroy {
  menuOpen = false;
  user: AccountInfo | null = null;
  userInitial = 'U';
  isAdmin = false;

  cart: CartItem[] = [];
  historialPedidos: ConfirmedOrder[] = [];

  private cartSub!: Subscription;
  private ordersSub!: Subscription;

  constructor(
    private msalService: MsalService,
    private router: Router,
    private cartService: CartService
  ) {}

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

    this.cartSub = this.cartService.cart$.subscribe(cart => this.cart = cart);
    this.ordersSub = this.cartService.orders$.subscribe(orders => this.historialPedidos = orders);
  }

  ngOnDestroy(): void {
    this.cartSub?.unsubscribe();
    this.ordersSub?.unsubscribe();
  }

  get totalItemsCarrito(): number {
    return this.cartService.totalItems;
  }

  get totalPagar(): number {
    return this.cartService.totalPagar;
  }

  formatoPrecio(precio: number): string {
    return precio.toLocaleString('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    });
  }

  incrementarCantidad(item: CartItem): void {
    this.cartService.incrementar(item);
  }

  decrementarCantidad(item: CartItem): void {
    this.cartService.decrementar(item);
  }

  confirmarPedido(): void {
    this.cartService.confirmarPedido().subscribe({
      next: () => alert('¡Pedido confirmado con éxito!'),
      error: () => alert('Ocurrió un error al confirmar el pedido con ms-order.')
    });
  }

  toggleMenu(): void { this.menuOpen = !this.menuOpen; }
  goToAdmin(): void { this.menuOpen = false; if (this.isAdmin) this.router.navigate(['/admin']); }
  logout(): void { this.menuOpen = false; this.msalService.logoutRedirect({ postLogoutRedirectUri: window.location.origin }); }
}