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
    this.msalService.loginPopup({
      scopes: ['User.Read']
    }).subscribe({
      next: (result) => {
        console.log('Login exitoso:', result);

        this.msalService.instance.setActiveAccount(result.account);

        this.router.navigate(['/inicio']);
      },
      error: (error) => {
        console.error('Error de inicio de sesión:', error);
      }
    });
  }
}