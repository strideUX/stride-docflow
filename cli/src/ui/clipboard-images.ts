import clipboardy from 'clipboardy';
import imageType from 'image-type';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import * as p from '@clack/prompts';

export interface PastedImage {
  id: string;
  filename: string;
  path: string;
  type: string;
  placeholder: string;
}

class ClipboardImageManager {
  private images: Map<string, PastedImage> = new Map();
  private imageCounter = 0;
  private tempDir: string;

  constructor() {
    // Create temp directory for pasted images
    this.tempDir = path.join(os.tmpdir(), 'docflow-images');
    fs.ensureDirSync(this.tempDir);
  }

  async detectClipboardContent(): Promise<'text' | 'image' | 'empty'> {
    try {
      // First check if there's any clipboard content
      const hasContent = await clipboardy.read();
      if (!hasContent) return 'empty';

      // Check for image paths or base64 images
      if (hasContent.startsWith('data:image/')) {
        return 'image';
      }

      // Check if it's a file path to an image
      if (this.isImageFilePath(hasContent)) {
        return 'image';
      }

      return 'text';
    } catch (error) {
      return 'empty';
    }
  }

  private isImageFilePath(text: string): boolean {
    // Check if it's a valid file path to an image
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.tiff', '.svg'];
    const trimmed = text.trim();
    
    // Must be a reasonable file path length and have image extension
    if (trimmed.length > 1000) return false;
    
    return imageExtensions.some(ext => trimmed.toLowerCase().endsWith(ext)) &&
           (trimmed.startsWith('/') || trimmed.startsWith('~') || trimmed.includes(':/'));
  }

  async handlePastedImage(): Promise<PastedImage | null> {
    try {
      const clipboardContent = await clipboardy.read();
      
      // Handle different clipboard image formats
      let imageBuffer: Buffer | null = null;
      let originalFilename = 'pasted-image';
      let sourceType = 'clipboard';
      
      if (clipboardContent.startsWith('data:image/')) {
        // Base64 encoded image
        const base64Data = clipboardContent.split(',')[1];
        if (base64Data) {
          imageBuffer = Buffer.from(base64Data, 'base64');
          sourceType = 'base64';
        }
      } else if (this.isImageFilePath(clipboardContent)) {
        // File path - copy the file
        const trimmedPath = clipboardContent.trim();
        
        // Clean up escaped characters and expand ~ to home directory if needed
        const cleanPath = trimmedPath.replace(/\\ /g, ' ').replace(/\\\(/g, '(').replace(/\\\)/g, ')');
        const expandedPath = cleanPath.startsWith('~') 
          ? path.join(os.homedir(), cleanPath.slice(1))
          : cleanPath;
          
        if (await fs.pathExists(expandedPath)) {
          imageBuffer = await fs.readFile(expandedPath);
          originalFilename = path.basename(expandedPath, path.extname(expandedPath));
          sourceType = 'file';
        } else {
          p.log.warn(`Image file not found: ${expandedPath}`);
          return null;
        }
      }

      if (!imageBuffer) {
        return null;
      }

      // Detect image type
      const type = await imageType(imageBuffer);
      if (!type) {
        p.log.warn('Could not determine image type');
        return null;
      }

      // Generate unique filename
      this.imageCounter++;
      const id = `image-${this.imageCounter}`;
      const filename = `${originalFilename}-${Date.now()}.${type.ext}`;
      const imagePath = path.join(this.tempDir, filename);

      // Save image to temp directory
      await fs.writeFile(imagePath, imageBuffer);

      const pastedImage: PastedImage = {
        id,
        filename,
        path: imagePath,
        type: type.mime,
        placeholder: `[${chalk.cyan(`Image ${this.imageCounter}`)}] - ${originalFilename}.${type.ext} (${sourceType})`
      };

      this.images.set(id, pastedImage);
      return pastedImage;

    } catch (error) {
      p.log.warn(`Failed to handle pasted image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  async promptWithImageSupport(promptConfig: {
    message: string;
    placeholder?: string;
    validate?: (value: string) => string | void;
  }): Promise<{ text: string; images: PastedImage[] }> {
    const images: PastedImage[] = [];
    
    // Custom prompt that handles Ctrl+V for images
    p.log.info(`${promptConfig.message}`);
    p.log.info(`${chalk.gray('Tip: Paste images with')} ${chalk.cyan('Ctrl+V')} ${chalk.gray('(screenshots will be saved and analyzed)')}`);
    
    // For now, we'll use a simpler approach - detect if clipboard has image
    const clipboardType = await this.detectClipboardContent();
    
    if (clipboardType === 'image') {
      const shouldUseImage = await p.confirm({
        message: 'Detected image in clipboard. Would you like to include it?',
        initialValue: true
      });
      
      if (shouldUseImage && !p.isCancel(shouldUseImage)) {
        const pastedImage = await this.handlePastedImage();
        if (pastedImage) {
          images.push(pastedImage);
          p.log.success(`Added ${pastedImage.placeholder}`);
        }
      }
    }

    // Get text input
    const textOptions: any = {
      message: images.length > 0 ? 'Additional description (optional):' : promptConfig.message,
      placeholder: promptConfig.placeholder || ''
    };
    
    if (promptConfig.validate) {
      textOptions.validate = promptConfig.validate;
    }

    const textResponse = await p.text(textOptions);

    if (p.isCancel(textResponse)) {
      p.cancel('Operation cancelled');
      process.exit(0);
    }

    // Check if the text input contains image file paths
    if (textResponse && this.isImageFilePath(textResponse)) {
      const shouldUseAsImage = await p.confirm({
        message: `Detected image file path. Would you like to include "${path.basename(textResponse)}" as an image?`,
        initialValue: true
      });
      
      if (shouldUseAsImage && !p.isCancel(shouldUseAsImage)) {
        // Temporarily put the path in clipboard to process it
        const originalClipboard = await clipboardy.read();
        await clipboardy.write(textResponse);
        
        const pastedImage = await this.handlePastedImage();
        if (pastedImage) {
          images.push(pastedImage);
          console.log(`✅ Added ${pastedImage.placeholder}`);
          
          // Return the placeholder as text so it shows in the UI
          return {
            text: pastedImage.placeholder,
            images
          };
        }
        
        // Restore original clipboard content
        await clipboardy.write(originalClipboard);
        
        return {
          text: '', // Clear the text since we processed it as an image
          images
        };
      }
    }

    return {
      text: textResponse || '',
      images
    };
  }

  getImages(): PastedImage[] {
    return Array.from(this.images.values());
  }

  async cleanup(): Promise<void> {
    try {
      await fs.remove(this.tempDir);
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

export const clipboardImageManager = new ClipboardImageManager();

// Cleanup on process exit - but don't override main SIGINT handler
process.on('exit', () => {
  clipboardImageManager.cleanup();
});

process.on('beforeExit', () => {
  clipboardImageManager.cleanup();
});