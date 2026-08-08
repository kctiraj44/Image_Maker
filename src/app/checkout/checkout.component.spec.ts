import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CheckoutComponent } from './checkout.component';
import { FormsModule } from '@angular/forms';

describe('CheckoutComponent', () => {
  let component: CheckoutComponent;
  let fixture: ComponentFixture<CheckoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckoutComponent, FormsModule],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(CheckoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate subtotal correctly', () => {
    component.selectPackage('digital-full');
    expect(component.getSubtotal()).toBe(9.95);
  });

  it('should add addon prices to subtotal', () => {
    component.selectPackage('digital-full');
    component.toggleAddon('verification');
    expect(component.getSubtotal()).toBe(9.95 + 4.95);
  });

  it('should calculate tax correctly', () => {
    component.selectPackage('digital-full');
    const subtotal = component.getSubtotal();
    const tax = subtotal * 0.1;
    expect(component.getTax()).toBe(tax);
  });

  it('should apply promo code discount', () => {
    component.selectPackage('digital-full');
    component.promoCode = 'TEST10';
    component.applyPromo();
    expect(component.promoApplied).toBe(true);
    expect(component.getDiscount()).toBeGreaterThan(0);
  });

  it('should calculate total with tax and discount', () => {
    component.selectPackage('digital-full');
    component.promoCode = 'TEST10';
    component.applyPromo();
    const total =
      component.getSubtotal() + component.getTax() - component.getDiscount();
    expect(component.getTotal()).toBe(total);
  });

  it('should toggle addons', () => {
    const addon = component.addons[0];
    const initialState = addon.selected;
    component.toggleAddon(addon.id);
    expect(addon.selected).toBe(!initialState);
  });

  it('should select different packages', () => {
    component.selectPackage('digital-hd');
    const selected = component.getSelectedPackage();
    expect(selected?.id).toBe('digital-hd');
  });
});
