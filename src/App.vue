<template>
  <div id="global-uploader">
    <el-button style="position:fixed;top:10px;right:10px;padding:0px" type="text" @click="panelShow = !panelShow">传输列表</el-button>
    <uploader
      ref="uploader"
      :options="options"
      :auto-start="false"
      @file-added="onFileAdded"
      @file-success="onFileSuccess"
      @file-progress="onFileProgress"
      @file-error="onFileError"
    >
      <uploader-unsupport />

      <uploader-btn id="global-uploader-btn" ref="uploadBtn" :attrs="attrs">选择文件</uploader-btn>

      <uploader-list v-show="panelShow">
        <div slot-scope="props" class="file-panel">
          <div class="file-title">
            <h2 style="margin:0px">文件列表</h2>
            <div class="operate">
              <a @click="close">
                <i class="iconfont icon-close" />
              </a>
            </div>
          </div>

          <ul class="file-list">
            <li v-for="file in props.fileList" :key="file.id">
              <uploader-file ref="files" :class="'file_' + file.id" :file="file" :list="true" />
            </li>
            <div v-if="!props.fileList.length" class="no-file"><i class="iconfont icon-empty-file" /> 暂无待上传文件</div>
          </ul>
        </div>
      </uploader-list>

    </uploader>
  </div>
</template>

<script>
import SparkMD5 from 'spark-md5'
import config from '@/config'
export default {
  name: 'App',
  data() {
    return {
      options: {
        target: config.uploadHost,
        chunkSize: config.chunkSize,
        forceChunkSize: true,
        fileParameterName: 'file',
        maxChunkRetries: 3,
        testChunks: true, // 是否开启服务器分片校验
        // 服务器分片校验函数，秒传及断点续传基础
        checkChunkUploadedByResponse: function(chunk, res) {
          /* const objMessage = JSON.parse(res)
          if (objMessage.message === 'found') {
            return (objMessage.uploadedChunks || []).indexOf((chunk.offset + 1))
          } */
          return false
        },
        headers: {
        },
        query() {}
      },
      attrs: {
        accept: '*/*'
      },
      panelShow: false // 选择文件后，展示上传panel
    }
  },
  computed: {
    // Uploader实例
    uploader() {
      return this.$refs.uploader.uploader
    }
  },
  methods: {
    onFileAdded(file) {
      this.panelShow = true
      this.computeMD5(file)
    },
    onFileProgress(rootFile, file, chunk) {
      console.log(`上传中 ${file.name}，chunk：${chunk.startByte / 1024 / 1024} ~ ${chunk.endByte / 1024 / 1024}`)
    },
    onFileSuccess(rootFile, file, response, chunk) {
      // 服务器自定义的错误（即虽返回200，但是是错误的情况），这种错误是Uploader无法拦截的
      if (response !== 'done' && response !== 'partly_done') {
        this.$message({ message: response, type: 'error' })
        // 文件状态设为“失败”
        this.statusSet(file.id, 'failed')
        return
      }
    },
    onFileError(rootFile, file, response, chunk) {
      this.$message({
        message: response,
        type: 'error'
      })
    },

    /**
             * 计算md5，实现断点续传及秒传
             * @param file
             */
    computeMD5(file) {
      const fileReader = new FileReader()
      const blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice
      let currentChunk = 0
      const chunkSize = 10 * 1024 * 1000
      const chunks = Math.ceil(file.size / chunkSize)
      const spark = new SparkMD5.ArrayBuffer()

      // 文件状态设为"计算MD5"
      this.statusSet(file.id, 'md5')
      file.pause()

      loadNext()

      fileReader.onload = e => {
        spark.append(e.target.result)

        if (currentChunk < chunks) {
          currentChunk++
          loadNext()

          // 实时展示MD5的计算进度
          this.$nextTick(() => {
            window.$(`.myStatus_${file.id}`).text('校验MD5 ' + ((currentChunk / chunks) * 100).toFixed(0) + '%')
          })
        } else {
          const md5 = spark.end()
          this.computeMD5Success(md5, file)
        }
      }

      fileReader.onerror = function() {
        this.error(`文件${file.name}读取出错，请检查该文件`)
        file.cancel()
      }

      function loadNext() {
        const start = currentChunk * chunkSize
        const end = ((start + chunkSize) >= file.size) ? file.size : start + chunkSize

        fileReader.readAsArrayBuffer(blobSlice.call(file.file, start, end))
      }
    },

    computeMD5Success(md5, file) {
      // 将自定义参数直接加载uploader实例的opts上
      Object.assign(this.uploader.opts, {
        query: {
          ...this.params
        }
      })

      file.uniqueIdentifier = md5
      file.resume()
      this.statusRemove(file.id)
    },

    fileListShow() {
      const $list = window.$('#global-uploader .file-list')

      if ($list.is(':visible')) {
        $list.slideUp()
        this.collapse = true
      } else {
        $list.slideDown()
        this.collapse = false
      }
    },
    close() {
      this.uploader.cancel()

      this.panelShow = false
    },

    /**
             * 新增的自定义的状态: 'md5'、'transcoding'、'failed'
             * @param id
             * @param status
             */
    statusSet(id, status) {
      const statusMap = {
        md5: {
          text: '校验MD5',
          bgc: '#fff'
        },
        merging: {
          text: '合并中',
          bgc: '#e2eeff'
        },
        transcoding: {
          text: '转码中',
          bgc: '#e2eeff'
        },
        failed: {
          text: '上传失败',
          bgc: '#e2eeff'
        }
      }

      this.$nextTick(() => {
        window.$(`<p class="myStatus_${id}"></p>`).appendTo(`.file_${id} .uploader-file-status`).css({
          'position': 'absolute',
          'top': '0',
          'left': '0',
          'right': '0',
          'bottom': '0',
          'zIndex': '1',
          'backgroundColor': statusMap[status].bgc
        }).text(statusMap[status].text)
      })
    },
    statusRemove(id) {
      this.$nextTick(() => {
        window.$(`.myStatus_${id}`).remove()
      })
    },

    error(msg) {
      this.$notify({
        title: '错误',
        message: msg,
        type: 'error',
        duration: 2000
      })
    }
  }
}
</script>

<style scoped lang="scss">
  #global-uploader {
      .uploader {
        width: 100px;
      }
      .uploader-list {
        position: fixed;
        right: 10px;
        top: 40px;
        width: 520px;
      }
      .uploader-file {
        height: 36px;
        line-height: 36px;
      }

      .file-panel {
          background-color: #fff;
          border: 1px solid #e2e2e2;
          border-radius: 7px 7px 0 0;
          box-shadow: 0 0 10px rgba(0, 0, 0, .2);

          .file-title {
              display: flex;
              height: 40px;
              line-height: 40px;
              padding: 0 15px;
              border-bottom: 1px solid #ddd;

              .operate {
                  flex: 1;
                  text-align: right;
              }
          }

          .file-list {
              position: relative;
              height: 240px;
              overflow-x: hidden;
              overflow-y: auto;
              background-color: #fff;
              padding: 0px;
              > li {
                  background-color: #fff;
              }
          }

          &.collapse {
              .file-title {
                  background-color: #E7ECF2;
              }
          }
      }

      .no-file {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 16px;
      }

      ::v-deep .uploader-file-icon {
          width: 24px;
          height: 24px;
          position: relative;
          top: 4px;
          background: url(./assets/img-user.png);
          background-size: cover !important;
          margin-top: 0px;
          &[icon=image] {
              background: url(./assets/img-user.png);
          }
          &[icon=video] {
              background: url(./assets/img-user.png);
          }
          &[icon=document] {
              background: url(./assets/img-user.png);
          }
      }

      ::v-deep .uploader-file-actions > span {
          margin-right: 6px;
      }
  }

</style>
