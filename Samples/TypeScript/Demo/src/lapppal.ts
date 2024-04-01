/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

/**
读取文件，抽象文件数据（算是工具类）
 */
export class LAppPal {
  /**
   * 读取文件，抽象文件数据（算是工具类）
   *
   * @param filePath 読み込み対象ファイルのパス
   * @return
   * {
   *      buffer,   読み込んだバイトデータ
   *      size        ファイルサイズ
   * }
   */
  public static loadFileAsBytes(
    filePath: string,
    callback: (arrayBuffer: ArrayBuffer, size: number) => void
  ): void {
    fetch(filePath)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => callback(arrayBuffer, arrayBuffer.byteLength));
  }

  /**
   * デルタ時間（前回フレームとの差分）を取得する
   * @return デルタ時間[ms]
   */
  public static getDeltaTime(): number {
    return this.s_deltaTime;
  }

  public static updateTime(): void {
    this.s_currentFrame = Date.now();
    this.s_deltaTime = (this.s_currentFrame - this.s_lastFrame) / 1000;
    this.s_lastFrame = this.s_currentFrame;
  }

  /**
   * メッセージを出力する
   * @param message 文字列
   */
  public static printMessage(message: string): void {
    console.log(message);
  }

  static lastUpdate = Date.now();

  static s_currentFrame = 0.0;
  static s_lastFrame = 0.0;
  static s_deltaTime = 0.0;
}
