import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { App } from './app';
import { HomeComponent } from './home.component';

@NgModule({
  declarations: [App, HomeComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    RouterModule.forRoot([
      { path: '', component: HomeComponent },
    ]),
  ],
  bootstrap: [App],
})
export class AppModule {}
