import config from '@/config'
const baseData = {
  fondsList: 'getData/1'
}

export default function getUrl(path) {
  return (`${config.BASE_API}/${baseData[path]}`)
}
