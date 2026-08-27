import { Component } from '@angular/core';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  constructor(
    private msalService: MsalService
  ) {}

  login(): void {

    this.msalService.loginRedirect({
      scopes: ['User.Read']
    }).subscribe({

      next: () => {
        console.log('Redireccionando a Microsoft...');
      },

      error: (error) => {
        console.error(
          'Error al iniciar sesión con Microsoft:',
          error
        );
      }

    });

  }

}