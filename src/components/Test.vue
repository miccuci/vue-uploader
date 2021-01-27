<template>
  <div>
    base
  </div>
</template>

<script>
import getUrl from '@/service'
import { post } from '@/service/request.js'
export default {
  created() {
    const url = getUrl('fondsList')
    post(url, {
    }).then(res => {
    })
  }
}
</script>

<style lang="scss" scoped>

</style>
