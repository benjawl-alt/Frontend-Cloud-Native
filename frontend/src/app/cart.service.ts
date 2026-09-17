import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';

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

export interface ConfirmedOrder {
  id: string;
  items: CartItem[];
  totalAmount: number;
  createdAt: string;
  dispatchMethod: string;
}

const CART_KEY = 'pedidos360_cart';
const ORDERS_KEY = 'pedidos360_orders';

@Injectable({ providedIn: 'root' })
export class CartService {

  private cartSubject = new BehaviorSubject<CartItem[]>(this.loadFromStorage(CART_KEY));
  cart$ = this.cartSubject.asObservable();

  private ordersSubject = new BehaviorSubject<ConfirmedOrder[]>(this.loadFromStorage(ORDERS_KEY));
  orders$ = this.ordersSubject.asObservable();

  constructor(private http: HttpClient) {}

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

  addToCart(product: Product): { ok: boolean; reason?: 'sin-stock' | 'stock-maximo' } {
    if (product.stock <= 0) return { ok: false, reason: 'sin-stock' };

    const cart = [...this.cart];
    const item = cart.find(i => i.product.name === product.name);

    if (item) {
      if (item.quantity >= product.stock) return { ok: false, reason: 'stock-maximo' };
      item.quantity++;
    } else {
      cart.push({ product, quantity: 1 });
    }

    this.setCart(cart);
    return { ok: true };
  }

  incrementar(item: CartItem): void {
    const cart = this.cart.map(i =>
      i.product.name === item.product.name
        ? { ...i, quantity: Math.min(i.quantity + 1, i.product.stock) }
        : i
    );
    this.setCart(cart);
  }

  decrementar(item: CartItem): void {
    const cart = this.cart
      .map(i => i.product.name === item.product.name ? { ...i, quantity: i.quantity - 1 } : i)
      .filter(i => i.quantity > 0);
    this.setCart(cart);
  }

  clearCart(): void {
    this.setCart([]);
  }

  confirmarPedido(dispatchMethod: string = 'RETIRO_TIENDA'): Observable<any> {
    if (this.cart.length === 0) {
      return throwError(() => new Error('carrito-vacio'));
    }

    const payload = {
      items: this.cart.map(item => ({
        productName: item.product.name,
        unitPrice: item.product.price,
        quantity: item.quantity
      })),
      totalAmount: this.totalPagar,
      dispatchMethod
    };

    return this.http.post('http://localhost:8081/api/orders', payload).pipe(
      tap(() => {
        const order: ConfirmedOrder = {
          id: 'local-' + Date.now(),
          items: this.cart,
          totalAmount: this.totalPagar,
          createdAt: new Date().toISOString(),
          dispatchMethod
        };
        this.setOrders([order, ...this.orders]);
        this.clearCart();
      })
    );
  }

  private setCart(cart: CartItem[]): void {
    this.cartSubject.next(cart);
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  private setOrders(orders: ConfirmedOrder[]): void {
    this.ordersSubject.next(orders);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }

  private loadFromStorage<T>(key: string): T {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : ([] as unknown as T);
    } catch {
      return [] as unknown as T;
    }
  }
}