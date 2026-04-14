import nock from 'nock'

nock.disableNetConnect()
nock.enableNetConnect('127.0.0.1')
if (process.env.ENABLE_NET_CONNECT === 'true') {
  nock.enableNetConnect()
}
