import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { AccountInfo } from '@azure/msal-browser';
import { Subscription } from 'rxjs';
import { ProductosService, Product } from './productos.service';
import { CartService, CartItem } from '../cart.service';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './productos.html',
  styleUrl: './productos.css'
})
export class Productos implements OnInit, OnDestroy {

  productos: Product[] = [];
  cargando = true;
  error = '';

  menuOpen = false;
  user: AccountInfo | null = null;
  userInitial = '👤';
  isAdmin = false;

  cart: CartItem[] = [];
  cartOpen = false;

  mostrarToast = false;
  toastMensaje = '';
  toastTipo: 'ok' | 'aviso' = 'ok';
  animarCarrito = false;
  private toastTimeout: any;
  private cartSub!: Subscription;

  constructor(
    private productosService: ProductosService,
    private msalService: MsalService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.resolverUsuario();
    this.cargarProductos();

    this.cartSub = this.cartService.cart$.subscribe(cart => {
      this.cart = cart;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.cartSub?.unsubscribe();
    clearTimeout(this.toastTimeout);
  }

  resolverUsuario(): void {
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
  }

  cargarProductos(): void {
    this.cargando = true;
    this.error = '';
    this.cdr.detectChanges();

    this.productosService.getProducts().subscribe({
      next: (datos) => {
        this.productos = datos;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al obtener productos:', err);
        this.error = 'No se pudieron cargar los productos desde el servidor.';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  formatoPrecio(precio: number): string {
    return precio.toLocaleString('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    });
  }

  toggleCart(): void {
    this.cartOpen = !this.cartOpen;
  }

  agregarAlCarrito(producto: Product): void {
    if (!this.user) {
      this.mostrarNotificacion('Debes iniciar sesión para agregar productos al carrito', 3000, 'aviso');
      return;
    }

    const resultado = this.cartService.addToCart(producto);

    if (resultado.ok) {
      this.mostrarNotificacion(`¡${producto.name} agregado al carrito!`);
    } else if (resultado.reason === 'stock-maximo') {
      alert(`Stock máximo disponible alcanzado (${producto.stock}).`);
    }
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
      this.mostrarNotificacion('Debes iniciar sesión para confirmar tu pedido', 3000, 'aviso');
      return;
    }

    if (this.cart.length === 0) {
      alert('El carrito está vacío.');
      return;
    }

    this.cartService.confirmarPedido().subscribe({
      next: () => {
        this.cartOpen = false;
        this.mostrarNotificacion('¡Compra exitosa!', 3000);
        this.cargarProductos(); // refresca el catálogo con el stock actualizado
      },
      error: (err) => {
        console.error('Error al registrar pedido:', err);

        if (err.status === 409) {
          alert('Uno de los productos ya no tiene stock suficiente. Actualizamos el catálogo, revisa tu carrito.');
          this.cargarProductos();
        } else {
          alert('Ocurrió un error al procesar el pedido con ms-order.');
        }
      }
    });
  }

  private mostrarNotificacion(mensaje: string, duracion: number = 2000, tipo: 'ok' | 'aviso' = 'ok'): void {
    this.toastMensaje = mensaje;
    this.toastTipo = tipo;
    this.mostrarToast = true;
    this.animarCarrito = tipo === 'ok';

    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.mostrarToast = false;
      this.animarCarrito = false;
      this.cdr.detectChanges();
    }, duracion);

    this.cdr.detectChanges();
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.dataset['fallback']) return; // ya intentó el placeholder: no reintentar
    img.dataset['fallback'] = 'true';
    img.src = '/images/productos/placeholder.svg';
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  irALogin(): void {
    this.menuOpen = false;
    this.router.navigate(['/login']);
  }

  logout(): void {
    this.menuOpen = false;
    this.msalService.logoutRedirect({ postLogoutRedirectUri: window.location.origin });
  }
}