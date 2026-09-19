import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { AccountInfo } from '@azure/msal-browser';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { CartService, CartItem, Product } from '../cart.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit, OnDestroy {

  menuOpen = false;
  cartOpen = false;
  user: AccountInfo | null = null;
  userInitial = '👤';
  isAdmin = false;

  products: Product[] = [];
  cargandoProductos = false;
  errorProductos = '';

  cart: CartItem[] = [];
  private cartSub!: Subscription;

  toastMensaje = '';
  toastTipo: 'ok' | 'aviso' = 'ok';
  mostrarToast = false;
  animarCarrito = false;
  private toastTimeout: any;

  constructor(
    private msalService: MsalService,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
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
      this.isAdmin =
        roles.includes('Admin') ||
        roles.includes('Administrator') ||
        roles.includes('Administrador');
    }

    this.obtenerProductos();

    this.cartSub = this.cartService.cart$.subscribe(cart => {
      this.cart = cart;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.cartSub?.unsubscribe();
    clearTimeout(this.toastTimeout);
  }

  obtenerProductos(): void {
    this.cargandoProductos = true;
    this.errorProductos = '';

    this.http.get<Product[]>('http://localhost:8082/api/products').subscribe({
      next: (data) => {
        this.products = data;
        this.cargandoProductos = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al obtener productos:', err);
        this.cargandoProductos = false;
        this.errorProductos = 'No se pudieron cargar los productos desde ms-product.';
        this.cdr.detectChanges();
      }
    });
  }

  toggleCart(): void {
    this.cartOpen = !this.cartOpen;
  }

  agregarAlCarrito(prod: Product): void {
    if (!this.user) {
      this.dispararFeedbackVisual('Debes iniciar sesión para agregar productos al carrito', 'aviso');
      return;
    }

    const resultado = this.cartService.addToCart(prod);

    if (resultado.ok) {
      this.dispararFeedbackVisual(`¡${prod.name} agregado al carrito!`);
    } else if (resultado.reason === 'stock-maximo') {
      alert(`Has alcanzado el límite de existencias (${prod.stock}) para este producto.`);
    }
  }

  private dispararFeedbackVisual(mensaje: string, tipo: 'ok' | 'aviso' = 'ok'): void {
    this.toastMensaje = mensaje;
    this.toastTipo = tipo;
    this.mostrarToast = true;
    this.animarCarrito = tipo === 'ok';

    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.mostrarToast = false;
      this.animarCarrito = false;
      this.cdr.detectChanges();
    }, tipo === 'aviso' ? 3000 : 2200);

    this.cdr.detectChanges();
  }

  incrementarCantidad(item: CartItem): void {
    this.cartService.incrementar(item);
  }

  decrementarCantidad(item: CartItem): void {
    this.cartService.decrementar(item);
  }

  get totalItemsCarrito(): number {
    return this.cartService.totalItems;
  }

  get totalPagar(): number {
    return this.cartService.totalPagar;
  }

  confirmarPedido(): void {
    if (!this.user) {
      this.dispararFeedbackVisual('Debes iniciar sesión para confirmar tu pedido', 'aviso');
      return;
    }

    if (this.cart.length === 0) {
      alert('El carrito está vacío.');
      return;
    }

    this.cartService.confirmarPedido().subscribe({
      next: () => {
        this.cartOpen = false;
        this.dispararFeedbackVisual('¡Compra exitosa!');
        this.obtenerProductos(); // refresca el stock mostrado
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al procesar el pedido:', err);
        if (err.status === 409) {
          alert('Uno de los productos ya no tiene stock suficiente. Actualizamos el catálogo, revisa tu carrito.');
          this.obtenerProductos();
        } else {
          alert('Ocurrió un error al enviar el pedido a ms-order.');
        }
      }
    });
  }

  get destacados(): Product[] {
    return this.products.slice(0, 4);
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.dataset['fallback']) return; // ya intentó el placeholder: no reintentar
    img.dataset['fallback'] = 'true';
    img.src = '/images/productos/placeholder.svg';
  }

  toggleMenu(): void { this.menuOpen = !this.menuOpen; }
  goToAdmin(): void { this.menuOpen = false; if (this.isAdmin) this.router.navigate(['/admin']); }
  irALogin(): void { this.menuOpen = false; this.router.navigate(['/login']); }
  logout(): void { this.menuOpen = false; this.msalService.logoutRedirect({ postLogoutRedirectUri: window.location.origin }); }
}