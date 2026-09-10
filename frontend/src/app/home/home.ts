import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { AccountInfo } from '@azure/msal-browser';
// IMPORTANTE: Importamos el HttpClient
import { HttpClient } from '@angular/common/http'; 

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {

  menuOpen = false;
  user: AccountInfo | null = null;
  userInitial = 'U';
  isAdmin = false;

  constructor(
    private msalService: MsalService,
    private router: Router,
    // IMPORTANTE: Inyectamos el HttpClient en el constructor
    private http: HttpClient 
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

      // ==========================================
      // NOMBRE DEL USUARIO
      // ==========================================
      const name = account.name || account.username || 'Usuario';
      this.userInitial = name.trim().charAt(0).toUpperCase();

      // ==========================================
      // COMPROBAR ROL DE ADMINISTRADOR
      // ==========================================
      const claims = account.idTokenClaims as any;
      const roles = claims?.roles || [];
      this.isAdmin =
        roles.includes('Admin') ||
        roles.includes('Administrator') ||
        roles.includes('Administrador');

      console.log('Usuario:', name);
      console.log('Roles:', roles);
      console.log('¿Es administrador?:', this.isAdmin);
    }
  }

  // ==========================================
  // ABRIR/CERRAR MENÚ
  // ==========================================
  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  // ==========================================
  // IR AL DASHBOARD
  // ==========================================
  goToAdmin(): void {
    this.menuOpen = false;
    if (this.isAdmin) {
      this.router.navigate(['/admin']);
    }
  }

  // ==========================================
  // CERRAR SESIÓN
  // ==========================================
  logout(): void {
    this.menuOpen = false;
    this.msalService.logoutRedirect({
      postLogoutRedirectUri: window.location.origin
    });
  }

  // ==========================================
  // PRUEBA DE CONEXIÓN CON EL BACKEND PROTEGIDO
  // ==========================================
  crearPedidoPrueba(): void {
    console.log('Enviando petición segura al backend...');
    
    // El MsalInterceptor que configuramos en app.config.ts atrapará esto 
    // y le pegará el token de Azure AD automáticamente.
    this.http.post('http://localhost:8081/api/orders', {}).subscribe({
      next: (respuesta) => {
        console.log('¡Éxito! El backend respondió:', respuesta);
        alert('¡Conexión exitosa! El token funcionó, Spring Boot validó tu identidad y guardó el registro en Mongo.');
      },
      error: (error) => {
        console.error('Error en la petición:', error);
        if (error.status === 401) {
          alert('Error 401 (Unauthorized): El backend bloqueó la petición. Revisa si el interceptor está enviando el token en la pestaña Network.');
        } else {
          alert('Error de red. ¿Está encendido el contenedor de Docker en el puerto 8081?');
        }
      }
    });
  }
}