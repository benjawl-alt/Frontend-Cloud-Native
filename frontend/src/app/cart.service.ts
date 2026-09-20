import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { EventMessage, EventType } from '@azure/msal-browser';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../environments/environment';

export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ConfirmedOrder {
  id: string;
  items: CartItem[];
  totalAmount: number;
  createdAt: string;
  dispatchMethod: string;
}

// Forma del pedido que devuelve ms-order
interface BackendOrderItem {
  productId?: string;
  productName: string;
  unitPrice: number;
  quantity: number;
}

interface BackendOrder {
  id: string;
  userEmail: string;
  status: string;
  totalAmount: number;
  dispatchMethod: string;
  createdAt: string;
  items: BackendOrderItem[];
}

// El carrito se guarda por usuario: pedidos360_cart_<id de la cuenta>
const CART_KEY_PREFIX = 'pedidos360_cart_';
// Claves antiguas (compartidas entre cuentas): se eliminan
const LEGACY_KEYS = ['pedidos360_cart', 'pedidos360_orders'];

@Injectable({ providedIn: 'root' })
export class CartService {

  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  cart$ = this.cartSubject.asObservable();

  // El historial viene del backend (no se guarda en el navegador)
  private ordersSubject = new BehaviorSubject<ConfirmedOrder[]>([]);
  orders$ = this.ordersSubject.asObservable();

  private currentKey = '__init__';

  constructor(
    private http: HttpClient,
    private msalService: MsalService,
    private msalBroadcast: MsalBroadcastService
  ) {
    LEGACY_KEYS.forEach(k => {
      try { localStorage.removeItem(k); } catch { /* ignorar */ }
    });

    this.sync();

    // Si cambia la sesión (login, cambio de cuenta, logout), carga el carrito de ese usuario
    this.msalBroadcast.msalSubject$.subscribe((msg: EventMessage) => {
      if (
        msg.eventType === EventType.LOGIN_SUCCESS ||
        msg.eventType === EventType.ACTIVE_ACCOUNT_CHANGED ||
        msg.eventType === EventType.LOGOUT_SUCCESS
      ) {
        this.sync();
      }
    });
  }

  // ---------- Usuario actual ----------

  private storageKey(): string {
    const instance = this.msalService.instance;
    const account = instance.getActiveAccount() ?? instance.getAllAccounts()[0];
    const id = account?.homeAccountId || account?.username;
    return id ? CART_KEY_PREFIX + id : '';
  }

  // Si cambió el usuario, carga SU carrito y limpia el historial en memoria
  private sync(): void {
    const key = this.storageKey();
    if (key === this.currentKey) return;

    this.currentKey = key;
    this.cartSubject.next(key ? this.loadCart(key) : []);
    this.ordersSubject.next([]);
  }

  // ---------- Getters ----------

  get cart(): CartItem[] {
    return this.cartSubject.value;
  }

  get orders(): ConfirmedOrder[] {
    return this.ordersSubject.value;
  }

  get totalItems(): number {
    return this.cart.reduce((acc, item) => acc + item.quantity, 0);
  }

  get totalPagar(): number {
    return this.cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  }

  // ---------- Carrito ----------

  private same(a: Product, b: Product): boolean {
    return a.id && b.id ? a.id === b.id : a.name === b.name;
  }

  addToCart(product: Product): { ok: boolean; reason?: 'sin-stock' | 'stock-maximo' } {
    this.sync();
    if (product.stock <= 0) return { ok: false, reason: 'sin-stock' };

    const existente = this.cart.find(i => this.same(i.product, product));

    if (existente) {
      if (existente.quantity >= product.stock) return { ok: false, reason: 'stock-maximo' };
      this.setCart(this.cart.map(i =>
        this.same(i.product, product)
          ? { product, quantity: i.quantity + 1 } // refresca stock y precio
          : i
      ));
    } else {
      this.setCart([...this.cart, { product, quantity: 1 }]);
    }

    return { ok: true };
  }

  incrementar(item: CartItem): void {
    this.sync();
    this.setCart(this.cart.map(i =>
      this.same(i.product, item.product)
        ? { ...i, quantity: Math.min(i.quantity + 1, i.product.stock) }
        : i
    ));
  }

  decrementar(item: CartItem): void {
    this.sync();
    this.setCart(
      this.cart
        .map(i => this.same(i.product, item.product) ? { ...i, quantity: i.quantity - 1 } : i)
        .filter(i => i.quantity > 0)
    );
  }

  clearCart(): void {
    this.setCart([]);
  }

  // ---------- Pedidos (backend) ----------

  confirmarPedido(dispatchMethod: string = 'RETIRO_TIENDA'): Observable<any> {
    this.sync();
    if (this.cart.length === 0) {
      return throwError(() => new Error('carrito-vacio'));
    }

    const payload = {
      items: this.cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        unitPrice: item.product.price,
        quantity: item.quantity
      })),
      totalAmount: this.totalPagar,
      dispatchMethod
    };

    return this.http.post(environment.ordersUrl, payload).pipe(
      tap(() => this.clearCart())
    );
  }

  // Trae del servidor SOLO los pedidos del usuario logueado
  obtenerMisPedidos(): Observable<ConfirmedOrder[]> {
    this.sync();
    return this.http.get<BackendOrder[]>(`${environment.ordersUrl}/mine`).pipe(
      map(pedidos => pedidos.map(p => this.toConfirmedOrder(p))),
      tap(pedidos => this.ordersSubject.next(pedidos))
    );
  }

  private toConfirmedOrder(p: BackendOrder): ConfirmedOrder {
    return {
      id: p.id,
      totalAmount: p.totalAmount,
      createdAt: p.createdAt,
      dispatchMethod: p.dispatchMethod,
      items: (p.items ?? []).map(it => ({
        quantity: it.quantity,
        product: {
          id: it.productId,
          name: it.productName,
          description: '',
          price: it.unitPrice,
          stock: 0
        }
      }))
    };
  }

  // ---------- Almacenamiento ----------

  private setCart(cart: CartItem[]): void {
    this.cartSubject.next(cart);
    if (!this.currentKey) return; // sin sesión: solo en memoria
    try {
      localStorage.setItem(this.currentKey, JSON.stringify(cart));
    } catch { /* almacenamiento lleno o bloqueado: el carrito sigue en memoria */ }
  }

  private loadCart(key: string): CartItem[] {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}