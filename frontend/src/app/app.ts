import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {

  title = 'frontend';

  constructor(
    private msalService: MsalService,
    private router: Router
  ) {}

  ngOnInit(): void {

    this.msalService.handleRedirectObservable().subscribe({
      next: (result) => {

        if (result?.account) {
          this.msalService.instance.setActiveAccount(result.account);

          console.log('Usuario autenticado:', result.account);

          this.router.navigate(['/inicio']);
        }

      },

      error: (error) => {
        console.error('Error procesando autenticación MSAL:', error);
      }
    });

  }
}