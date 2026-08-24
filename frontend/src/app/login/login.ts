import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  constructor(
    private router: Router,
    private msalService: MsalService
  ) {}

  login() {
    // Cambiamos loginPopup por loginRedirect
    this.msalService.loginRedirect({
      scopes: ['User.Read']
    }).subscribe({
      next: () => {
        console.log('Redireccionando a Microsoft...');
      },
      error: (error) => {
        console.error('Error al iniciar el redireccionamiento:', error);
      }
    });
  }
}
