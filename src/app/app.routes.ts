import { Routes } from '@angular/router';
import { UploadComponent } from './upload/upload.component';
import { ImageUploadComponent } from './image-upload/image-upload.component';
import { CropimageComponent } from './cropimage/cropimage.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { AdminComponent } from './admin/admin.component';
import { SuccessComponent } from './success/success.component';
import { CancelComponent } from './cancel/cancel.component';

export const routes: Routes = [
  { path: '', component: UploadComponent },
  { path: 'image-upload', component: ImageUploadComponent },
  { path: 'crop', component: CropimageComponent },
  { path: 'checkout', component: CheckoutComponent },
  { path: 'success', component: SuccessComponent },
  { path: 'cancel', component: CancelComponent },
  { path: 'admin', component: AdminComponent }
];