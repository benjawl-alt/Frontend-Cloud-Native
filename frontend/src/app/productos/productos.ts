import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MsalService } from '@azure/msal-angular';
import { AccountInfo } from '@azure/msal-browser';
import { ProductosService, Product } from './productos.service';

export interface CartItem {
  product: Product;
  quantity: number;
}

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './productos.html',
  styleUrl: './productos.css'
})
export class Productos implements OnInit {

  productos: Product[] = [];
  cargando = true;
  error = '';

  // Control de sesión y menú
  menuOpen = false;
  user: AccountInfo | null = null;
  userInitial = 'U';
  isAdmin = false;

  // Carrito de compras
  cart: CartItem[] = [];
  cartOpen = false;

  // Notificación tipo toast
  mostrarToast = false;
  toastMensaje = '';
  animarCarrito = false;
  private toastTimeout: any;

  constructor(
    private productosService: ProductosService,
    private msalService: MsalService,
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.resolverUsuario();
    this.cargarProductos();
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

  // Lógica del Carrito
  toggleCart(): void {
    this.cartOpen = !this.cartOpen;
  }

  agregarAlCarrito(producto: Product): void {
    if (producto.stock <= 0) {
      return;
    }

    const item = this.cart.find(i => i.product.name === producto.name);

    if (item) {
      if (item.quantity < producto.stock) {
        item.quantity++;
        this.mostrarNotificacion(`+1 ${producto.name} agregado`);
      } else {
        alert(`Stock máximo disponible alcanzado (${producto.stock}).`);
      }
    } else {
      this.cart.push({ product: producto, quantity: 1 });
      this.mostrarNotificacion(`¡${producto.name} agregado al carrito!`);
    }
  }

  incrementarCantidad(item: CartItem): void {
    if (item.quantity < item.product.stock) {
      item.quantity++;
    }
  }

  decrementarCantidad(item: CartItem): void {
    if (item.quantity > 1) {
      item.quantity--;
    } else {
      this.cart = this.cart.filter(i => i !== item);
    }
  }

  get totalItemsCarrito(): number {
    return this.cart.reduce((acc, item) => acc + item.quantity, 0);
  }

  get totalPagar(): number {
    return this.cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  }

  confirmarPedido(): void {
    if (this.cart.length === 0) {
      alert('El carrito está vacío.');
      return;
    }

    const payload = {
      items: this.cart.map(item => ({
        productName: item.product.name,
        unitPrice: item.product.price,
        quantity: item.quantity
      })),
      totalAmount: this.totalPagar,
      dispatchMethod: 'RETIRO_TIENDA'
    };

    this.http.post('http://localhost:8081/api/orders', payload).subscribe({
      next: () => {
        alert('¡Pedido realizado con éxito!');
        this.cart = [];
        this.cartOpen = false;
        this.cargarProductos(); // Refresca catálogo para reflejar stock actualizado
      },
      error: (err) => {
        console.error('Error al registrar pedido:', err);
        alert('Ocurrió un error al procesar el pedido con ms-order.');
      }
    });
  }

  private mostrarNotificacion(mensaje: string): void {
    this.toastMensaje = mensaje;
    this.mostrarToast = true;
    this.animarCarrito = true;

    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.mostrarToast = false;
      this.animarCarrito = false;
      this.cdr.detectChanges();
    }, 2000);

    this.cdr.detectChanges();
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  logout(): void {
    this.menuOpen = false;
    this.msalService.logoutRedirect({
      postLogoutRedirectUri: window.location.origin
    });
  }
}