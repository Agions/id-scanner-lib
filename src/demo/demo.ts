import { IDScanner, IDCardInfo } from '../index';

export class IDScannerDemo {
  private scanner: IDScanner;
  private videoElement: HTMLVideoElement;
  private resultContainer: HTMLElement;
  private switchButton: HTMLButtonElement;
  
  constructor(videoElementId: string, resultContainerId: string, switchButtonId: string) {
    this.videoElement = document.getElementById(videoElementId) as HTMLVideoElement;
    this.resultContainer = document.getElementById(resultContainerId) as HTMLElement;
    this.switchButton = document.getElementById(switchButtonId) as HTMLButtonElement;
    
    this.scanner = new IDScanner({
      onQRCodeScanned: this.handleQRCodeResult.bind(this),
      onBarcodeScanned: this.handleQRCodeResult.bind(this), // 复用QR码结果处理
      onIDCardScanned: this.handleIDCardResult.bind(this),
      onError: this.handleError.bind(this)
    });
    
    this.switchButton.addEventListener('click', this.toggleScanMode.bind(this));
  }
  
  async initialize(): Promise<void> {
    await this.scanner.initialize();
    await this.scanner.startQRScanner(this.videoElement);
    this.switchButton.textContent = '切换到身份证模式';
    this.currentMode = 'qr';
  }
  
  private currentMode: 'qr' | 'barcode' | 'idcard' = 'qr';
  
  private async toggleScanMode(): Promise<void> {
    this.scanner.stop();
    
    if (this.currentMode === 'qr') {
      this.currentMode = 'barcode';
      await this.scanner.startBarcodeScanner(this.videoElement);
      this.switchButton.textContent = '切换到身份证模式';
    } else if (this.currentMode === 'barcode') {
      this.currentMode = 'idcard';
      await this.scanner.startIDCardScanner(this.videoElement);
      this.switchButton.textContent = '切换到二维码模式';
    } else {
      this.currentMode = 'qr';
      await this.scanner.startQRScanner(this.videoElement);
      this.switchButton.textContent = '切换到条形码模式';
    }
    
    this.resultContainer.innerHTML = '';
  }
  
  private handleQRCodeResult(result: string): void {
    this.resultContainer.innerHTML = `
      <h3>扫描结果:</h3>
      <p>${result}</p>
    `;
  }
  
  private handleIDCardResult(info: IDCardInfo): void {
    this.resultContainer.innerHTML = `
      <h3>身份证信息:</h3>
      <p>姓名: ${info.name || '未识别'}</p>
      <p>性别: ${info.gender || '未识别'}</p>
      <p>民族: ${info.nationality || '未识别'}</p>
      <p>出生日期: ${info.birthDate || '未识别'}</p>
      <p>地址: ${info.address || '未识别'}</p>
      <p>身份证号: ${info.idNumber || '未识别'}</p>
      <p>签发机关: ${info.issuingAuthority || '未识别'}</p>
      <p>有效期限: ${info.validPeriod || '未识别'}</p>
    `;
  }
  
  private handleError(error: Error): void {
    console.error('扫描错误:', error);
    this.resultContainer.innerHTML = `
      <div class="error">
        <h3>错误:</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
  
  stop(): void {
    this.scanner.stop();
    this.scanner.terminate();
  }
} 