import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OrderItem {
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

  private apiUrl = 'http://localhost:8081/api/orders';

  constructor(private http: HttpClient) {}

  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.apiUrl);
  }

  crearPedidoPrueba() {
    return this.http.post(this.apiUrl, {});
  }
}