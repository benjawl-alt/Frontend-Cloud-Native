import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  stock: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  // URL del microservicio ms-product
  private apiUrl = 'http://localhost:8082/api/products';

  constructor(private http: HttpClient) {}

  // Gracias a app.config.ts, el MsalInterceptor adjunta el token Bearer automáticamente
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }
}