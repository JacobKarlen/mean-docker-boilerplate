import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { User } from '../../shared/models/user';
import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiEndpoint = environment.apiEndpoint;

  constructor(private http: HttpClient) {
    console.log(this.apiEndpoint);
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiEndpoint + '/users');
  }

}
