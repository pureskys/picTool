import JSZip from 'jszip'
import { saveAs } from 'file-saver'

/**
 * 图片处理工具类
 * 提供图片压缩、格式转换和批量下载功能
 */
export class ImageProcessor {
  /**
   * 压缩单张图片
   * @param {File} file - 图片文件
   * @param {string} targetFormat - 目标格式 (image/jpeg, image/png, image/webp)
   * @param {number} targetSize - 目标大小 (字节)
   * @param {number} initialQuality - 初始质量 (0-1)
   * @param {number} [maxWidth=2000] - 图片最大宽度 (像素)
   * @returns {Promise<{blob: Blob, quality: number, originalSize: number, compressedSize: number}>}
   */
  static async compressImage(file, targetFormat, targetSize, initialQuality, maxWidth = 2000) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () =>
          this._processImage(img, targetFormat, targetSize, initialQuality, maxWidth)
            .then(resolve)
            .catch(reject)
        img.onerror = () => reject(new Error('图片加载失败'))
        img.src = event.target.result
      }
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsDataURL(file)
    })
  }

  /**
   * 处理多张图片并打包下载
   * @param {Array<File>} files - 图片文件数组
   * @param {string} targetFormat - 目标格式
   * @param {number} targetSize - 目标大小 (KB)
   * @param {number} initialQuality - 初始质量
   * @param {number} [maxWidth=2000] - 图片最大宽度 (像素)
   * @returns {Promise<void>}
   */
  static async processAndDownloadMultiple(
    files,
    targetFormat,
    targetSize,
    initialQuality,
    maxWidth = 2000,
  ) {
    const zip = new JSZip()
    const imgFolder = zip
    const targetSizeBytes = targetSize * 1024

    // 并行处理所有图片
    const processingPromises = files.map(async (file) => {
      try {
        const result = await this.compressImage(
          file,
          targetFormat,
          targetSizeBytes,
          initialQuality,
          maxWidth,
        )

        const ext = this._getFormatExtension(targetFormat)
        const timestamp = new Date().getTime()
        const newFilename = `picTool-${this._getFileNameWithoutExtension(file.name)}-${timestamp}.${ext}`
        imgFolder.file(newFilename, result.blob)
      } catch (error) {
        console.error(`处理图片 ${file.name} 失败:`, error)
        throw error
      }
    })

    await Promise.all(processingPromises)

    // 生成压缩包并下载
    const content = await zip.generateAsync({ type: 'blob' })
    const timestamp = new Date().getTime()
    saveAs(content, `picTool-${timestamp}.zip`)
  }

  /**
   * 处理单张图片并下载
   * @param {File} file - 图片文件
   * @param {string} targetFormat - 目标格式
   * @param {number} targetSize - 目标大小 (KB)
   * @param {number} initialQuality - 初始质量
   * @param {number} [maxWidth=2000] - 图片最大宽度 (像素)
   * @returns {Promise<void>}
   */
  static async processAndDownloadSingle(
    file,
    targetFormat,
    targetSize,
    initialQuality,
    maxWidth = 2000,
  ) {
    const result = await this.compressImage(
      file,
      targetFormat,
      targetSize * 1024,
      initialQuality,
      maxWidth,
    )

    const ext = this._getFormatExtension(targetFormat)
    const timestamp = new Date().getTime()
    const newFilename = `picTool-${this._getFileNameWithoutExtension(file.name)}-${timestamp}.${ext}`
    saveAs(result.blob, newFilename)
  }

  /**
   * 内部方法 - 实际处理图片
   * @private
   */
  static _processImage(img, targetFormat, targetSize, initialQuality, maxWidth) {
    return new Promise((resolve) => {
      // 创建canvas
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      // 计算新尺寸保持宽高比
      let width = img.width
      let height = img.height

      // 如果设置了maxWidth且图片宽度超过，则按比例缩放
      if (maxWidth > 0 && width > maxWidth) {
        const ratio = maxWidth / width
        width = maxWidth
        height = height * ratio
      }

      canvas.width = width
      canvas.height = height

      // 绘制图像
      ctx.drawImage(img, 0, 0, width, height)

      // 二分法查找最佳质量参数
      this._findBestQuality(canvas, targetFormat, targetSize, initialQuality).then(resolve)
    })
  }

  /**
   * 内部方法 - 使用二分法查找最佳质量参数
   * @private
   */
  static _findBestQuality(canvas, targetFormat, targetSize, initialQuality) {
    return new Promise((resolve) => {
      let minQuality = 0.1
      let maxQuality = 1
      let bestBlob = null
      let bestSizeDiff = Infinity
      let iterations = 0
      const maxIterations = 10 // 最大迭代次数防止无限循环

      const tryQuality = (quality) => {
        return new Promise((resolveTry) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolveTry({ blob: null, size: 0 })
                return
              }

              const sizeDiff = Math.abs(blob.size - targetSize)
              const isBetter = sizeDiff < bestSizeDiff && blob.size <= targetSize

              if (isBetter || bestBlob === null) {
                bestBlob = blob
                bestSizeDiff = sizeDiff
              }

              resolveTry({ blob, size: blob.size })
            },
            targetFormat,
            quality,
          )
        })
      }

      const binarySearch = async () => {
        iterations++
        const midQuality = (minQuality + maxQuality) / 2

        // 尝试中间质量
        const { size } = await tryQuality(midQuality)

        // 检查是否达到目标或最大迭代次数
        if (
          iterations >= maxIterations ||
          Math.abs(size - targetSize) < targetSize * 0.05 || // 误差在5%以内
          maxQuality - minQuality < 0.05
        ) {
          // 最后尝试最佳质量
          if (bestBlob && bestBlob.size <= targetSize) {
            resolve({
              blob: bestBlob,
              quality: midQuality,
              originalSize: canvas.width * canvas.height * 4, // 近似原始大小
              compressedSize: bestBlob.size,
            })
          } else {
            // 如果找不到小于目标大小的，返回最接近的
            const { blob } = await tryQuality(minQuality)
            resolve({
              blob,
              quality: minQuality,
              originalSize: canvas.width * canvas.height * 4,
              compressedSize: blob.size,
            })
          }
          return
        }

        // 调整搜索范围
        if (size > targetSize) {
          maxQuality = midQuality
        } else {
          minQuality = midQuality
        }

        // 继续搜索
        setTimeout(binarySearch, 0)
      }

      // 开始搜索
      binarySearch()
    })
  }

  /**
   * 内部方法 - 获取文件名的无扩展名版本
   * @private
   */
  static _getFileNameWithoutExtension(filename) {
    return filename.replace(/\.[^/.]+$/, '')
  }

  /**
   * 内部方法 - 根据格式获取文件扩展名
   * @private
   */
  static _getFormatExtension(format) {
    const formatMap = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    }
    return formatMap[format] || 'jpg'
  }
}
