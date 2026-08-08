import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms'; // ✅ Add this
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-upload',
  imports: [CommonModule,FormsModule,RouterModule],
  standalone: true,
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.css'
})
export class UploadComponent {

  selectedCountry: string = 'US';
selectedDocType: string = 'passport';


  selectedImage: File | null = null;
  imagePreview: string | null = null;
  resizedImageUrl: string | null = null;

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'image/jpeg') {
      this.selectedImage = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
        this.resizedImageUrl = null;
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please upload a JPEG image.');
    }
  }

  onResizeClick(): void {
    // Simulate resizing — we'll replace this with backend later
    this.resizedImageUrl = this.imagePreview;
  }
}
