
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription, timer } from 'rxjs';

import { ProductosService, Product } from '../productos/productos.service';
import { environment } from '../../environments/environment';

// =========================
// INTERFACES DE PEDIDOS
// =========================

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

// =========================
// INTERFACES KAFKA STREAMS
// =========================

export interface LowStockAlert {
  productId: string;
  productName: string;
  currentStock: number;
  threshold: number;
  detectedAt: string;
}

export interface TopProduct {
  productName: string;
  unitsSold: number;
}

// =========================
// COMPONENTE ADMIN
// =========================

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin implements OnInit, OnDestroy {

  private readonly ordersUrl = environment.ordersUrl;

  // =========================
  // PRODUCTOS Y PEDIDOS
  // =========================

  productos: Product[] = [];
  pedidos: Order[] = [];

  cargando = true;
  error = '';

  // =========================
  // FORMULARIO PRODUCTOS
  // =========================

  modalAbierto = false;
  modoEdicion = false;
  productoForm: Product = this.productoVacio();
  guardando = false;

  // =========================
  // KAFKA STREAMS
  // =========================

  alertasStock: LowStockAlert[] = [];
  topProductos: TopProduct[] = [];

  private streamSub?: Subscription;

  constructor(
    private productosService: ProductosService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  // =========================
  // INICIALIZACIÓN
  // =========================

  ngOnInit(): void {
    this.cargarDatos();

    // Actualiza el dashboard cada 5 segundos
    this.streamSub = timer(0, 5000).subscribe(() => {
      this.cargarStreaming();
    });
  }

  ngOnDestroy(): void {
    this.streamSub?.unsubscribe();
  }

  // =========================
  // CARGAR PRODUCTOS Y PEDIDOS
  // =========================

  cargarDatos(): void {
    this.cargando = true;
    this.error = '';

    this.productosService.getProducts().subscribe({
      next: (data: Product[]) => {
        this.productos = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'No se pudieron cargar los productos desde ms-product.';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });

    this.http.get<Order[]>(this.ordersUrl).subscribe({
      next: (data: Order[]) => {
        this.pedidos = data;
        this.cdr.detectChanges();
      },
      error: (err: unknown) =>
        console.error('Error al obtener pedidos:', err)
    });
  }

  // =========================
  // DASHBOARD: KAFKA STREAMS
  // =========================

  cargarStreaming(): void {

    // Alertas de stock bajo
    this.http.get<LowStockAlert[]>(
      `${this.ordersUrl}/stream/alerts`
    ).subscribe({
      next: (data) => {
        this.alertasStock = data;
        this.cdr.detectChanges();
      },
      error: (err: unknown) =>
        console.error('Error al obtener alertas de stock:', err)
    });

    // Productos más vendidos
    this.http.get<TopProduct[]>(
      `${this.ordersUrl}/stream/top-products?limit=5`
    ).subscribe({
      next: (data) => {
        this.topProductos = data;
        this.cdr.detectChanges();
      },
      error: (err: unknown) =>
        console.error('Error al obtener productos más demandados:', err)
    });
  }

  porcentajeStock(a: LowStockAlert): number {
    return a.threshold > 0
      ? Math.min(100, Math.round(
          (a.currentStock / a.threshold) * 100
        ))
      : 0;
  }

  anchoBarra(unidades: number): number {
    const max = this.topProductos.length
      ? this.topProductos[0].unitsSold
      : 1;

    return max > 0
      ? Math.round((unidades / max) * 100)
      : 0;
  }

  // =========================
  // MÉTRICAS DEL DASHBOARD
  // =========================

  get totalPedidos(): number {
    return this.pedidos.length;
  }

  get ventasTotales(): number {
    return this.pedidos.reduce(
      (acc, p) => acc + (p.totalAmount || 0),
      0
    );
  }

  get ticketPromedio(): number {
    return this.totalPedidos > 0
      ? this.ventasTotales / this.totalPedidos
      : 0;
  }

  get totalProductos(): number {
    return this.productos.length;
  }

  get productosSinStock(): number {
    return this.productos.filter(p => p.stock === 0).length;
  }

  get pedidosRecientes(): Order[] {
    return [...this.pedidos]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      )
      .slice(0, 6);
  }

  // =========================
  // FORMATO Y ESTADOS
  // =========================

  formatoPrecio(precio: number): string {
    return (precio || 0).toLocaleString('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    });
  }

  estadoClase(status: string): string {
    switch ((status || '').toUpperCase()) {
      case 'COMPLETADO':
        return 'completed';

      case 'EN_DESPACHO':
        return 'delivery';

      default:
        return 'preparing';
    }
  }

  // =========================
  // CRUD DE PRODUCTOS
  // =========================

  private productoVacio(): Product {
    return {
      name: '',
      description: '',
      price: 0,
      stock: 0
    };
  }

  abrirModalNuevo(): void {
    this.modoEdicion = false;
    this.productoForm = this.productoVacio();
    this.modalAbierto = true;
  }

  abrirModalEditar(producto: Product): void {
    this.modoEdicion = true;
    this.productoForm = { ...producto };
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
  }

  guardarProducto(): void {
    if (
      !this.productoForm.name ||
      this.productoForm.price == null ||
      this.productoForm.stock == null
    ) {
      alert('Completa nombre, precio y stock.');
      return;
    }

    this.guardando = true;

    const peticion =
      this.modoEdicion && this.productoForm.id
        ? this.productosService.updateProduct(
            this.productoForm.id,
            this.productoForm
          )
        : this.productosService.createProduct(
            this.productoForm
          );

    peticion.subscribe({
      next: () => {
        this.guardando = false;
        this.modalAbierto = false;
        this.cargarDatos();
      },
      error: (err: unknown) => {
        console.error('Error al guardar producto:', err);
        this.guardando = false;
        alert('Ocurrió un error al guardar el producto.');
      }
    });
  }

  eliminarProducto(producto: Product): void {
    if (!producto.id) {
      console.warn(
        'Producto sin id, no se puede eliminar:',
        producto
      );
      return;
    }

    if (
      !confirm(
        `¿Eliminar "${producto.name}"? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    this.productosService.deleteProduct(producto.id).subscribe({
      next: () => this.cargarDatos(),
      error: (err: unknown) => {
        console.error('Error al eliminar producto:', err);
        alert('Ocurrió un error al eliminar el producto.');
      }
    });
  }
}
