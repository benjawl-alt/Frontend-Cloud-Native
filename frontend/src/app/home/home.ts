import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { AccountInfo } from '@azure/msal-browser';
import { HttpClient } from '@angular/common/http';

export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  stock: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {

  menuOpen = false;
  cartOpen = false;
  user: AccountInfo | null = null;
  userInitial = 'U';
  isAdmin = false;

  products: Product[] = [];
  cargandoProductos = false;
  errorProductos = '';

  cart: CartItem[] = [];

  // Variables para la notificación y animación visual
  toastMensaje = '';
  mostrarToast = false;
  animarCarrito = false;
  private toastTimeout: any;

  constructor(
    private msalService: MsalService,
    private router: Router,
    private http: HttpClient,
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
      this.isAdmin =
        roles.includes('Admin') ||
        roles.includes('Administrator') ||
        roles.includes('Administrador');
    }

    this.obtenerProductos();
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
    const itemExistente = this.cart.find(item => item.product.name === prod.name);

    if (itemExistente) {
      if (itemExistente.quantity < prod.stock) {
        itemExistente.quantity++;
        this.dispararFeedbackVisual(`+1 ${prod.name} agregado`);
      } else {
        alert(`Has alcanzado el límite de existencias (${prod.stock}) para este producto.`);
      }
    } else {
      this.cart.push({ product: prod, quantity: 1 });
      this.dispararFeedbackVisual(`¡${prod.name} agregado al carrito!`);
    }
  }

  // Notificación flotante y pulso en el ícono
  private dispararFeedbackVisual(mensaje: string): void {
    this.toastMensaje = mensaje;
    this.mostrarToast = true;
    this.animarCarrito = true;

    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.mostrarToast = false;
      this.animarCarrito = false;
      this.cdr.detectChanges();
    }, 2200);

    this.cdr.detectChanges();
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
    return this.cart.reduce((total, item) => total + item.quantity, 0);
  }

  get totalPagar(): number {
    return this.cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
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
        alert('¡Pedido generado y guardado exitosamente en MongoDB!');
        this.cart = [];
        this.cartOpen = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al procesar el pedido:', err);
        alert('Ocurrió un error al enviar el pedido a ms-order.');
      }
    });
  }

  toggleMenu(): void { this.menuOpen = !this.menuOpen; }
  goToAdmin(): void { this.menuOpen = false; if (this.isAdmin) this.router.navigate(['/admin']); }
  logout(): void { this.menuOpen = false; this.msalService.logoutRedirect({ postLogoutRedirectUri: window.location.origin }); }
}