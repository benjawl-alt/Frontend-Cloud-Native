import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ProductosService, Product } from '../productos/productos.service';
import { environment } from '../../environments/environment';
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

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin implements OnInit {

  private readonly ordersUrl = environment.ordersUrl;

  productos: Product[] = [];
  pedidos: Order[] = [];
  cargando = true;
  error = '';

  modalAbierto = false;
  modoEdicion = false;
  productoForm: Product = this.productoVacio();
  guardando = false;

  constructor(
    private productosService: ProductosService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

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
      error: (err: unknown) => console.error('Error al obtener pedidos:', err)
    });
  }

  get totalPedidos(): number {
    return this.pedidos.length;
  }

  get ventasTotales(): number {
    return this.pedidos.reduce((acc, p) => acc + (p.totalAmount || 0), 0);
  }

  get ticketPromedio(): number {
    return this.totalPedidos > 0 ? this.ventasTotales / this.totalPedidos : 0;
  }

  get totalProductos(): number {
    return this.productos.length;
  }

  get productosSinStock(): number {
    return this.productos.filter(p => p.stock === 0).length;
  }

  get pedidosRecientes(): Order[] {
    return [...this.pedidos]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
  }

  formatoPrecio(precio: number): string {
    return (precio || 0).toLocaleString('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    });
  }

  estadoClase(status: string): string {
    switch ((status || '').toUpperCase()) {
      case 'COMPLETADO': return 'completed';
      case 'EN_DESPACHO': return 'delivery';
      default: return 'preparing';
    }
  }

  private productoVacio(): Product {
    return { name: '', description: '', price: 0, stock: 0 };
  }

  abrirModalNuevo(): void {
    console.log('abrirModalNuevo() ejecutado');
    this.modoEdicion = false;
    this.productoForm = this.productoVacio();
    this.modalAbierto = true;
  }

  abrirModalEditar(producto: Product): void {
    console.log('abrirModalEditar() ejecutado', producto);
    this.modoEdicion = true;
    this.productoForm = { ...producto };
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
  }

  guardarProducto(): void {
    if (!this.productoForm.name || this.productoForm.price == null || this.productoForm.stock == null) {
      alert('Completa nombre, precio y stock.');
      return;
    }

    this.guardando = true;

    const peticion = this.modoEdicion && this.productoForm.id
      ? this.productosService.updateProduct(this.productoForm.id, this.productoForm)
      : this.productosService.createProduct(this.productoForm);

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
      console.warn('Producto sin id, no se puede eliminar:', producto);
      return;
    }
    if (!confirm(`¿Eliminar "${producto.name}"? Esta acción no se puede deshacer.`)) return;

    this.productosService.deleteProduct(producto.id).subscribe({
      next: () => this.cargarDatos(),
      error: (err: unknown) => {
        console.error('Error al eliminar producto:', err);
        alert('Ocurrió un error al eliminar el producto.');
      }
    });
  }
}