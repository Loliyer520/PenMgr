import { BasePage } from './base-page.js'

// 笔阵管理（PenMgr）：LoliAPP 骨架的独立管理 app。
// 看 chaty 上所有在线笔，并对选中设备拉一张屏幕 / 摄像头快照。
// 抓帧全部由 43 机 ForAPI 的 /penmgr 后端完成（借 chaty 管理员终端隧道），
// 本应用只负责列表、选择、展示和自动刷新节拍。
class App extends $falcon.App {
  onLaunch(options) {
    super.onLaunch(options)
    // 936px 横屏设计稿，px 布局随设备宽度等比缩放
    this.setViewPort(936)
    $falcon.useDefaultBasePageClass(BasePage)
  }

  onShow() {
    super.onShow()
  }

  onHide() {
    super.onHide()
  }

  onDestroy() {
    super.onDestroy()
  }
}

try {
  globalThis['window'] = {
    requestAnimationFrame,
    cancelAnimationFrame
  }
} catch (err) {
}

try {
  globalThis['process'] = {
    env: {
      NODE_ENV: 'production'
    }
  }
} catch (err) {
}

export default App
