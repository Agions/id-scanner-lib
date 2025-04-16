import { IDScanner, IDCardInfo } from "../index"

export class IDScannerDemo {
  private scanner: IDScanner
  private videoElement: HTMLVideoElement
  private resultContainer: HTMLElement
  private switchButton: HTMLButtonElement
  private imageInput: HTMLInputElement | null = null

  constructor(
    videoElementId: string,
    resultContainerId: string,
    switchButtonId: string,
    imageInputId?: string
  ) {
    // 获取DOM元素
    this.videoElement = document.getElementById(
      videoElementId
    ) as HTMLVideoElement
    this.resultContainer = document.getElementById(
      resultContainerId
    ) as HTMLElement
    this.switchButton = document.getElementById(
      switchButtonId
    ) as HTMLButtonElement

    // 如果提供了图片输入元素ID，初始化图片输入功能
    if (imageInputId) {
      this.imageInput = document.getElementById(
        imageInputId
      ) as HTMLInputElement
      if (this.imageInput) {
        this.imageInput.addEventListener(
          "change",
          this.handleImageInput.bind(this)
        )
      }
    }

    try {
      // 创建IDScanner实例
      this.scanner = new IDScanner({
        onQRCodeScanned: this.handleQRCodeResult.bind(this),
        onBarcodeScanned: this.handleQRCodeResult.bind(this), // 复用QR码结果处理
        onIDCardScanned: this.handleIDCardResult.bind(this),
        onError: this.handleError.bind(this),
      })
    } catch (error) {
      console.error("创建IDScanner实例失败:", error)
      this.handleError(error instanceof Error ? error : new Error("初始化失败"))
      // 创建一个空对象以避免空引用错误
      this.scanner = {} as IDScanner
    }

    // 添加模式切换按钮事件监听
    this.switchButton.addEventListener("click", this.toggleScanMode.bind(this))
  }

  async initialize(): Promise<void> {
    try {
      await this.scanner.initialize()
      await this.scanner.startQRScanner(this.videoElement)
      this.switchButton.textContent = "切换到身份证模式"
      this.currentMode = "qr"
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error("初始化失败"))
    }
  }

  private currentMode: "qr" | "barcode" | "idcard" = "qr"

  private async toggleScanMode(): Promise<void> {
    try {
      this.scanner.stop()

      if (this.currentMode === "qr") {
        this.currentMode = "barcode"
        await this.scanner.startBarcodeScanner(this.videoElement)
        this.switchButton.textContent = "切换到身份证模式"
      } else if (this.currentMode === "barcode") {
        this.currentMode = "idcard"
        await this.scanner.startIDCardScanner(this.videoElement)
        this.switchButton.textContent = "切换到二维码模式"
      } else {
        this.currentMode = "qr"
        await this.scanner.startQRScanner(this.videoElement)
        this.switchButton.textContent = "切换到条形码模式"
      }

      this.resultContainer.innerHTML = ""
    } catch (error) {
      this.handleError(
        error instanceof Error ? error : new Error("切换模式失败")
      )
    }
  }

  /**
   * 处理图片输入
   * 支持从文件选择器获取图片并进行识别
   */
  private async handleImageInput(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement
    if (!input.files || input.files.length === 0) return

    const file = input.files[0]

    try {
      // 检查文件类型
      if (!file.type.startsWith("image/")) {
        throw new Error("请选择图片文件")
      }

      // 创建一个本地URL以显示图片
      const imageUrl = URL.createObjectURL(file)

      // 显示处理中的提示
      this.resultContainer.innerHTML = `
        <h3>正在处理图片...</h3>
        <img src="${imageUrl}" style="max-width: 100%; max-height: 300px; margin-bottom: 10px;">
      `

      // 根据当前模式处理图片
      try {
        if (this.currentMode === "qr") {
          const result = await this.scanner.processQRCodeImage(imageUrl)
          if (result) {
            this.handleQRCodeResult(result)
          }
        } else if (this.currentMode === "barcode") {
          const result = await this.scanner.processBarcodeImage(imageUrl)
          if (result) {
            this.handleQRCodeResult(result)
          }
        } else if (this.currentMode === "idcard") {
          const result = await this.scanner.processIDCardImage(imageUrl)
          if (result) {
            this.handleIDCardResult(result)
          }
        }
      } catch (error) {
        // 如果处理失败，显示错误
        this.resultContainer.innerHTML = `
          <h3>识别结果:</h3>
          <img src="${imageUrl}" style="max-width: 100%; max-height: 300px; margin-bottom: 10px;">
          <p class="error">未能识别内容，请尝试其他图片或调整图片质量</p>
          <p class="error">${
            error instanceof Error ? error.message : "未知错误"
          }</p>
        `
      }

      // 清除文件选择，允许再次选择相同的文件
      input.value = ""
    } catch (error) {
      this.handleError(
        error instanceof Error ? error : new Error(String(error))
      )

      // 清除文件选择
      input.value = ""
    }
  }

  private handleQRCodeResult(result: string): void {
    this.resultContainer.innerHTML = `
      <h3>扫描结果:</h3>
      <p>${result}</p>
    `
  }

  private handleIDCardResult(info: IDCardInfo): void {
    this.resultContainer.innerHTML = `
      <h3>身份证信息:</h3>
      <p>姓名: ${info.name || "未识别"}</p>
      <p>性别: ${info.gender || "未识别"}</p>
      <p>民族: ${info.nationality || "未识别"}</p>
      <p>出生日期: ${info.birthDate || "未识别"}</p>
      <p>地址: ${info.address || "未识别"}</p>
      <p>身份证号: ${info.idNumber || "未识别"}</p>
      <p>签发机关: ${info.issuingAuthority || "未识别"}</p>
      <p>有效期限: ${info.validPeriod || "未识别"}</p>
    `
  }

  private handleError(error: Error): void {
    console.error("扫描错误:", error)
    this.resultContainer.innerHTML = `
      <div class="error">
        <h3>错误:</h3>
        <p>${error.message}</p>
      </div>
    `
  }

  stop(): void {
    if (this.scanner && typeof this.scanner.stop === "function") {
      this.scanner.stop()
    }
    if (this.scanner && typeof this.scanner.terminate === "function") {
      this.scanner.terminate()
    }
  }
}
