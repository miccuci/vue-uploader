import Vue from 'vue'

import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import '@/styles/index.scss' // global css
import App from './App'
import jquery from 'jquery'
import uploader from 'vue-simple-uploader'
Vue.use(ElementUI)
Vue.use(uploader)

Vue.config.productionTip = false
window.$ = jquery

new Vue({
  el: '#app',
  render: h => h(App)
})
