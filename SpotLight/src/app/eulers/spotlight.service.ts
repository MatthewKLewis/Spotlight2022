import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SpotlightService {
  constructor(private http: HttpClient) {}

  testSpotlight(id: number, dmxObject: any): Observable<any> {
    return this.http.post(`/api/move/${id}`, dmxObject);
  }
}
