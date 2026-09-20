import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface OrderItem {
  productId?: string;
  productName: string;
  unitPrice: number;
  quantity: number;
}

export interface Order {
  id: string;
  userEmail: string;
  status: string;
  totalAmount: number;
  dispatchMethod: string;
  createdAt: string;
  items: OrderItem[];
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private apiUrl = environment.ordersUrl;

  constructor(private http: HttpClient) {}

  // Pedidos del usuario logueado
  getMyOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/mine`);
  }

  // Todos los pedidos (solo admin)
  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.apiUrl);
  }

  crearPedidoPrueba() {
    return this.http.post(this.apiUrl, {});
  }
}