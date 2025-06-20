<template>
  <main class="flex h-full w-full flex-col items-center justify-center gap-3 bg-cyan-50 max-sm:p-5">
    <div class="text-4xl font-black">一键图片格式转换与压缩</div>
    <div class="font-sans font-bold text-gray-500">
      上传图片，选择目标格式和压缩质量，轻松转换并下载！支持 JPG、PNG、WEBP 等主流格式。
    </div>
    <div class="mt-6 flex min-w-110 flex-col rounded-xl bg-white p-6 px-8 shadow max-sm:w-full">
      <!--上传图片部分-->
      <div class="flex w-full items-center justify-center">
        <div class="flex h-full w-full items-center justify-center">
          <el-upload
            ref="uploadRef"
            :multiple="true"
            class="w-full [&_.el-upload-dragger]:h-[130px]! [&_.el-upload-dragger]:border-[3px]! [&_.el-upload-dragger]:border-dashed! [&_.el-upload-dragger]:border-blue-400! [&_.el-upload-dragger]:bg-blue-50!"
            drag
            :auto-upload="false"
            :on-change="handleImageChange"
            accept="image/*"
            list-type="picture"
          >
            <el-icon class="absolute top-1/5" size="26" color="#00BFFF	">
              <svg
                b="1750384700308"
                class="icon"
                viewBox="0 0 1024 1024"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                p-id="1810"
                width="200"
                height="200"
              >
                <path
                  d="M960.621531 575.791885 571.769268 575.791885l0 382.755404-120.688733 0L451.080535 575.791885 64.875566 575.791885 64.875566 448.207092l386.204969 0L451.080535 65.451688l120.688733 0 0 382.755404 388.853285 0L960.622554 575.791885z"
                  fill="#1296db"
                  p-id="1811"
                ></path>
              </svg>
            </el-icon>
          </el-upload>
        </div>
      </div>
      <!--转换格式选择部分-->
      <div class="mt-2 flex w-full flex-row items-center justify-center gap-3">
        <div class="text-[14px] text-gray-700">转换为：</div>
        <div>
          <el-select v-model="outputFormat" placeholder="Select" style="width: 90px">
            <el-option
              v-for="item in options"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </div>
      </div>
      <!--拖动条部分-->
      <div v-if="outputFormat !== 'image/png'">
        <div class="flex flex-row justify-between">
          <div class="translate-y-[6px] text-[13px] text-gray-500">压缩质量：</div>
          <div class="translate-y-[6px] text-[13px] font-bold text-blue-500">
            {{ compressionRate }} kb
          </div>
        </div>
        <div>
          <el-slider :min="10" :max="1024" v-model="compressionRate" :show-tooltip="false" />
        </div>
        <div class="flex translate-y-[-4px] flex-row-reverse text-[10px] text-gray-400">
          <div>数值越低，压缩越高，图片越小</div>
        </div>
      </div>
      <div v-else class="flex items-center justify-center">
        <div class="translate-y-[6px] text-[18px] text-gray-400">PNG 格式为无损格式不支持压缩</div>
      </div>
      <!--开始转换按钮部分-->
      <div class="w-full py-3">
        <el-button
          :loading="isLoading"
          @click="processAndDownload(fileList)"
          size="default"
          class="w-full"
          type="primary"
        >
          <div class="font-bold text-white">开始转换</div>
        </el-button>
      </div>
      <div class="flex items-center justify-center">
        <div class="text-[12px] text-gray-400">支持图片拖拽上传</div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ImageProcessor } from './../../utils/imageCompressor.js'

const options = [
  {
    value: 'image/jpeg',
    label: 'JPG',
  },
  {
    value: 'image/webp',
    label: 'WEBP',
  },
  {
    value: 'image/png',
    label: 'PNG',
  },
] // 下拉框选项

// 响应式数据
const isLoading = ref(false) // loading状态
const outputFormat = ref('image/jpeg') // 默认转换的图片格式
const compressionRate = ref(512) // 默认压缩率
const uploadRef = ref() // 挂起的图片文件
const fileList = ref([]) // 待处理图片数组

// 图片处理选项配置
const pic_option = computed(() => {
  return {
    targetFormat: outputFormat.value, // 目标图片格式
    targetSize: compressionRate.value, // 目标文件大小(KB)
    quality: 0.8, // 初始压缩质量(0-1)
    maxWidth: 2000, // 图片最大宽度(像素)
  }
})

// 处理图片上传
const handleImageChange = (uploadFile, uploadFiles) => {
  fileList.value = uploadFiles
}

// 处理并下载图片
const processAndDownload = async () => {
  console.log(pic_option.value)
  isLoading.value = true // 开启loading状态
  if (fileList.value.length === 0) {
    return
  }
  try {
    const files = fileList.value.map((item) => item.raw)

    if (files.length === 1) {
      await ImageProcessor.processAndDownloadSingle(
        files[0],
        pic_option.value.targetFormat,
        pic_option.value.targetSize,
        pic_option.value.quality,
        pic_option.value.maxWidth,
      )
    } else {
      await ImageProcessor.processAndDownloadMultiple(
        files,
        pic_option.value.targetFormat,
        pic_option.value.targetSize,
        pic_option.value.quality,
        pic_option.value.maxWidth,
      )
    }
  } catch (error) {
    ElMessage.error(`处理失败: ${error.message}`)
  } finally {
    uploadRef.value.clearFiles() // 清空挂起的图片
    fileList.value = [] // 清空待处理图片
    isLoading.value = false // 关闭loading状态
  }
}
</script>

<style lang="scss" scoped></style>
