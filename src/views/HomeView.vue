<template>
  <main class="flex h-full w-full flex-col items-center justify-center gap-3 bg-cyan-50 max-sm:p-5">
    <div class="text-4xl font-black">一键图片格式转换与压缩</div>
    <div class="font-sans font-bold text-gray-500">
      上传图片，选择目标格式和压缩质量，轻松转换并下载！支持 JPG、PNG、WEBP 等主流格式。
    </div>
    <div
      class="mt-6 flex h-[calc(100dvh/2)] min-h-[369px] w-[calc((100dvw/3)-20px)] max-w-[490px] min-w-100 flex-col rounded-xl bg-white p-6 px-8 shadow max-sm:w-full"
    >
      <!--上传图片部分-->
      <div class="flex w-full items-center justify-center">
        <div class="flex h-full w-full items-center justify-center">
          <el-upload
            class="w-[calc((100%/3)+0px)] min-w-[130px] [&_.el-upload-dragger]:border-[3px]! [&_.el-upload-dragger]:border-dashed! [&_.el-upload-dragger]:border-blue-400! [&_.el-upload-dragger]:bg-blue-50!"
            drag
          >
            <el-icon size="38" color="#00BFFF	">
              <upload-filled />
            </el-icon>
          </el-upload>
        </div>
      </div>
      <!--转换格式选择部分-->
      <div class="flex w-full flex-row items-center justify-center gap-3">
        <div class="text-[14px] text-gray-700">转换为：</div>
        <div>
          <el-select v-model="_select_value" placeholder="Select" style="width: 90px">
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
      <div>
        <div class="flex flex-row justify-between">
          <div class="translate-y-[8px] text-[13px] text-gray-500">压缩质量：</div>
          <div class="translate-y-[8px] text-[13px] font-bold text-blue-500">
            {{ _slider_value }}%
          </div>
        </div>
        <div>
          <el-slider v-model="_slider_value" :show-tooltip="false" />
        </div>
        <div class="flex translate-y-[-8px] flex-row-reverse text-[10px] text-gray-400">
          <div>数值越低，压缩越高，图片越小</div>
        </div>
      </div>
      <!--开始转换按钮部分-->
      <div class="w-full py-3">
        <el-button class="w-full" type="primary">
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
import { UploadFilled } from '@element-plus/icons-vue'
import { ref } from 'vue'

const _select_value = ref('JPG')
const options = [
  {
    value: 'JPG',
    label: 'JPG',
  },
  {
    value: 'PNG',
    label: 'PNG',
  },
  {
    value: 'WEBP',
    label: 'WEBP',
  },
]
const _slider_value = ref(0)
</script>

<style lang="scss" scoped></style>
