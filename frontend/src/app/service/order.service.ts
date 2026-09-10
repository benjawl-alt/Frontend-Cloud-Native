import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  
  // URL de tu microservicio corriendo en Docker
  private apiUrl = 'http://localhost:8081/api/orders';

  constructor(private http: HttpClient) {}

  crearPedidoPrueba() {
    // Hacemos un POST. El MsalInterceptor se encargará de inyectar el Token automáticamente
    return this.http.post(this.apiUrl, {});
  }
}