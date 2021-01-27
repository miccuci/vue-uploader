import axios from 'axios'
import { Message } from 'element-ui'
import Cookies from 'js-cookie'

class HttpRequest {
  constructor() {
    this.queue = {} // 请求队列
  }

  /**
   * 对外暴露请求方法
   * @param {*Object} options 自定义配置项
   */
  request(options) {
    const instance = axios.create()
    const unionOptions = { ...this.getInsideConfig(), ...options }
    this.interceptors(instance, unionOptions.url)
    return instance(unionOptions)
  }

  // 默认设置
  getInsideConfig(headers) {
    const config = {
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      }
    }
    if (document.cookie) {
      config.headers.Authorization = Cookies.get('BEARER_TOKEN') || ''
      config.headers['W-FLOW'] = Cookies.get('W-FLOW') || 'default'
      config.headers['W-SEQ'] = Cookies.get('W-SEQ') || '1569595974015_2'
      config.headers['ip'] = Cookies.get('ip') || 'http://127.0.0.1'
    }
    // config.headers.Authorization = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbXBsb3llZU5hbWUiOiLmm7Llv6Dmo64iLCJ1c2VyX25hbWUiOiJMMTAwNDQiLCJzY29wZSI6WyJyZWFkJTIwd3JpdGUiXSwiZW1wbG95ZWVJZCI6NTczOTM3NDY2OTYyMDIyNDMsImV4cCI6MTYxOTY2MDA4OCwiZW1wbG95ZWVObyI6IkwxMDA0NCIsImVtcGxveWVlSG9zcGl0YWxTT0lEIjoyNTYxODEsInVzZXJIb3NwaXRhbFNPSUQiOiIyNTYxODEiLCJ1c2VySWQiOjU3MzkzNzQ2Njk2MjAyMjQzLCJhdXRob3JpdGllcyI6WyJQUklWSUxFR0VfQUxMIl0sImp0aSI6ImVjMDQ1MTE1LTZhMTUtNDMwYi05ZjNjLTkwZjNiMjRlZmQ5MiIsImNsaWVudF9pZCI6ImNsaWVudCJ9.zKFFLorflkZ3ENeX4iJfUzih8_uhNbf4j1kKS7TYZM4'
    return config
  }

  // 状态200+成功请求
  succssRresponse(data) {
    // 各种处理
    if (data.invalidToken) {
      this.destroy()
    }
    if (!data.success) {
      Message.error(data.errorDetail.message)
    }
  }

  // 统一拦截
  interceptors(instance, url) {
    // 请求拦截
    instance.interceptors.request.use((config) => {
      return config
    }, error => Promise.reject(error))

    // 响应拦截
    instance.interceptors.response.use((res) => {
      this.destroy(url)
      // 随具体后端业务封装正确与错误处理--刷新refresh-token
      const { data, status } = res
      this.succssRresponse(data)
      return { data, status }
    }, (error) => {
      const errorMsg = error.message ? '错误信息：' + error.message : ''
      Message.error('接口数据错误，请刷新重试。' + errorMsg)
      this.destroy(url)
      // 随具体后端业务封装错误处理
      console.log(error.response)
      return Promise.reject(error)
    })
  }
}
export default HttpRequest
