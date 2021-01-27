import HttpRequest from './axios'

const myAxios = new HttpRequest()

// myAxios.defaults.timeout = 30 * 1000
// myAxios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded'
/**
 * getRequest => http get
 * @param url
 * @param params
 * @returns {*}
 */
export const getRequest = async(url, params) => {
  const urlStr = url + `?${translateParams(params)}`
  const parameters = {
    url: params ? urlStr : url,
    method: 'get'
  }

  const data = await myAxios.request(parameters)
  return data.data
}
/**
 * postRequest => http post
 * @param url
 * @param params
 * @returns {*}
 */
export const postRequest = async(url, params, headers) => {
  const parameters = {
    url: url,
    method: 'post',
    data: params
  }
  if (headers) parameters.headers = headers
  const data = await myAxios.request(parameters)
  return data.data
}

/**
 * translate obj params to string with &
 * @param params
 * @returns {string}
 */
function translateParams(params) {
  let url = ''
  for (const param in params) {
    url += `${param}=${encodeURIComponent(params[param])}&`
  }
  return url.substring(0, url.length - 1)
}

export async function get(url, params) {
  try {
    const data = await getRequest(url, params)
    return data
  } catch (e) {
    return errorHandler(e)
  }
}

export async function post(url, params) {
  try {
    const data = await postRequest(url, params)
    return data
  } catch (e) {
    return errorHandler(e)
  }
}

export function errorHandler(e) {
  if (e && e.code === 'ECONNABORTED') {
    return { errorType: 'timeout' }
  } else {
    return { errorType: 'networkError' }
  }
}
