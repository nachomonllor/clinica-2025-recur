import { ComponentFixture, TestBed } from '@angular/core/testing';

<<<<<<<< HEAD:src/app/components/paciente/estudios-subir/estudios-subir.component.spec.ts
import { EstudiosSubirComponent } from './estudios-subir.component';

describe('EstudiosSubirComponent', () => {
  let component: EstudiosSubirComponent;
  let fixture: ComponentFixture<EstudiosSubirComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstudiosSubirComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EstudiosSubirComponent);
========
import { LoginComponent } from './login.component';

describe('LoginPacienteComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
>>>>>>>> 1-6-mas-estilos:src/app/components/login/login.component.spec.ts
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
