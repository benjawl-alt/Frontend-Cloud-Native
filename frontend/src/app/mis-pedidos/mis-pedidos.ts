import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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

  // Aviso verde de compra exitosa
  mostrarToast = false;
  toastMensaje = '';
  private toastTimeout: any;

  private cartSub!: Subscription;
  private ordersSub!: Subscription;

  constructor(
    private msalService: MsalService,
    private router: Router,
    private cartService: CartService,
    private cdr: ChangeDetectorRef
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

    this.cartSub = this.cartService.cart$.subscribe(cart => {
      this.cart = cart;
      this.cdr.detectChanges();
    });

    this.ordersSub = this.cartService.orders$.subscribe(orders => {
      this.historialPedidos = orders;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.cartSub?.unsubscribe();
    this.ordersSub?.unsubscribe();
    clearTimeout(this.toastTimeout);
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
      next: () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.mostrarNotificacion('¡Compra exitosa!', 3000);
      },
      error: (err) => {
        console.error('Error al confirmar el pedido:', err);
        if (err.status === 409) {
          alert('Uno de los productos ya no tiene stock suficiente. Revisa tu carrito.');
        } else {
          alert('Ocurrió un error al confirmar el pedido con ms-order.');
        }
      }
    });
  }

  private mostrarNotificacion(mensaje: string, duracion: number = 2000): void {
    this.toastMensaje = mensaje;
    this.mostrarToast = true;

    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.mostrarToast = false;
      this.cdr.detectChanges();
    }, duracion);

    this.cdr.detectChanges();
  }

  toggleMenu(): void { this.menuOpen = !this.menuOpen; }
  goToAdmin(): void { this.menuOpen = false; if (this.isAdmin) this.router.navigate(['/admin']); }
  logout(): void { this.menuOpen = false; this.msalService.logoutRedirect({ postLogoutRedirectUri: window.location.origin }); }
}