<template>
  <div class="app">
    <!-- 左侧图标竖栏（小说页 doge-reader 同款） -->
    <div class="rail">
      <div class="rail-logo"><text class="rail-logo-t">笔</text></div>

      <div :class="['rail-btn', showChats ? 'rail-btn-on' : '']" @click="openChats">
        <text :class="['rail-glyph', showChats ? 'rail-glyph-on' : '']">聊</text>
      </div>
      <div :class="['rail-btn', showSettings ? 'rail-btn-on' : '']" @click="openSettings">
        <text :class="['rail-glyph', showSettings ? 'rail-glyph-on' : '']">设</text>
      </div>

      <div class="rail-spacer"></div>
      <div class="rail-status">
        <div :class="['rail-dot', serverOk ? 'rail-dot-on' : 'rail-dot-off']"></div>
      </div>
    </div>

    <!-- 主内容列 -->
    <div class="content">
      <!-- 标题区 -->
      <div class="title-area">
        <text class="page-title">笔阵管理</text>
        <text class="title-sub">{{ statusText }}</text>
        <div class="title-spacer"></div>
        <div class="vdev" v-if="selected">
          <text class="vdev-name">{{ selected.nickname }}</text>
          <text class="vdev-sub">{{ selected.id }} · {{ selected.mac || '无 MAC' }}</text>
        </div>
        <div class="vdev" v-else>
          <text class="vdev-name">未选择设备</text>
          <text class="vdev-sub">左侧点一台在线笔</text>
        </div>
        <div class="vh-tabs">
          <div :class="['vh-tab', kind === 'screen' ? 'vh-tab-on' : '']" @click="setKind('screen')">
            <text :class="['vh-tab-t', kind === 'screen' ? 'vh-tab-t-on' : '']">屏幕</text>
          </div>
          <div :class="['vh-tab', kind === 'camera' ? 'vh-tab-on' : '']" @click="setKind('camera')">
            <text :class="['vh-tab-t', kind === 'camera' ? 'vh-tab-t-on' : '']">摄像头</text>
          </div>
          <div :class="['vh-tab', kind === 'album' ? 'vh-tab-on' : '']" @click="setKind('album')">
            <text :class="['vh-tab-t', kind === 'album' ? 'vh-tab-t-on' : '']">相册</text>
          </div>
        </div>
        <div class="pill-ghost" @click="refreshDevices"><text class="pill-ghost-t">刷新设备</text></div>
      </div>

      <div class="body">
        <!-- 左：设备卡片列表 -->
        <div class="side">
          <div class="side-head">
            <div :class="['chip', showOffline ? '' : 'chip-on']" @click="setOfflineFilter(false)">
              <text :class="['chip-t', showOffline ? '' : 'chip-t-on']">在线 {{ onlineCount }}</text>
            </div>
            <div :class="['chip', showOffline ? 'chip-on' : '']" @click="setOfflineFilter(true)">
              <text :class="['chip-t', showOffline ? 'chip-t-on' : '']">全部 {{ totalCount }}</text>
            </div>
            <div class="side-spacer"></div>
            <div class="pager-mini" v-if="pageCount > 1">
              <div class="pg-btn" @click="prevPage"><text class="pg-t">‹</text></div>
              <text class="pg-num">{{ page + 1 }}/{{ pageCount }}</text>
              <div class="pg-btn" @click="nextPage"><text class="pg-t">›</text></div>
            </div>
            <text v-if="loadingDevices" class="side-loading">…</text>
          </div>

          <scroller class="dev-scroll">
            <div v-for="d in pagedDevices" :key="d.token"
                 :class="['dev-item', selected && selected.token === d.token ? 'dev-item-on' : '', d.online ? 'dev-item-live' : 'dev-item-off']"
                 @click="selectDevice(d)">
              <div :class="['dev-ava', selected && selected.token === d.token ? 'dev-ava-on' : '']">
                <text :class="['dev-ava-t', selected && selected.token === d.token ? 'dev-ava-t-on' : '']">{{ (d.nickname || '?').slice(0, 1) }}</text>
              </div>
              <div class="dev-info">
                <div class="dev-r1">
                  <text class="dev-name">{{ d.nickname }}</text>
                  <text class="dev-bat">{{ batteryText(d) }}</text>
                </div>
                <div class="dev-r2">
                  <text class="dev-id">{{ d.id }}</text>
                  <text class="dev-st">{{ deviceStatus(d) }}</text>
                </div>
                <div class="dev-r3" v-if="d.online && (d.remote_ip || d.location)">
                  <text class="dev-ip">{{ d.remote_ip }}</text>
                  <text class="dev-loc">{{ d.location || '归属地未知' }}</text>
                </div>
              </div>
              <div :class="['dev-live', d.online ? 'dev-live-on' : 'dev-live-off']"></div>
            </div>
            <div v-if="filteredDevices.length === 0" class="list-empty">
              <text class="list-empty-t">暂无设备</text>
            </div>
          </scroller>

        </div>

        <!-- 右：取景 -->
        <div class="main">
          <div class="stage">
            <scroller v-if="kind === 'album'" class="album-scroll" scroll-direction="vertical">
              <div v-for="(row, ri) in albumRows" :key="ri" class="album-row">
                <div v-for="it in row" :key="it.name" class="album-cell" @click="openViewer(it)">
                  <image v-if="it.thumb" class="album-thumb" :src="it.thumb" resize="cover"></image>
                  <div v-else class="album-ph"><text class="album-ph-t">…</text></div>
                  <text class="album-name">{{ it.shortName }}</text>
                </div>
              </div>
              <div v-if="albumRows.length === 0" class="album-empty">
                <text class="list-empty-t">{{ albumLoading ? '读取相册中…' : '相册为空' }}</text>
              </div>
            </scroller>
            <image v-else-if="imgSrc" class="stage-img" :src="imgSrc" resize="contain"></image>
            <text v-else class="stage-hint">{{ stageHint }}</text>
            <div v-if="shotLoading" class="stage-loading"><text class="stage-loading-t">抓帧中…</text></div>
          </div>

          <div class="view-bar" v-if="kind === 'album'">
            <text class="vb-info">相册 {{ albumTotal }} 张 · 第 {{ albumPage + 1 }} / {{ albumPageCount }} 页{{ albumLoading ? ' · 读取中…' : '' }}</text>
            <div class="vb-btns">
              <div class="vb-btn" @click="albumPrev"><text class="vb-btn-t">上一页</text></div>
              <div class="vb-btn" @click="albumNext"><text class="vb-btn-t">下一页</text></div>
              <div class="vb-btn vb-btn-accent" @click="refreshAlbum"><text class="vb-btn-t vb-btn-t-accent">刷新相册</text></div>
            </div>
          </div>
          <div class="view-bar" v-else>
            <text class="vb-info">{{ shotInfoText }}</text>
            <div class="vb-btns">
              <div :class="['vb-btn', auto ? 'vb-btn-on' : '']" @click="toggleAuto">
                <text :class="['vb-btn-t', auto ? 'vb-btn-t-on' : '']">{{ auto ? '停止自动' : '自动刷新' }}</text>
              </div>
              <div v-if="kind === 'camera'" class="vb-btn" @click="rotateCamera">
                <text class="vb-btn-t">旋转 {{ rotLabel }}</text>
              </div>
              <div class="vb-btn vb-btn-accent" @click="takeShot(true)">
                <text class="vb-btn-t vb-btn-t-accent">抓一张</text>
              </div>
            </div>
          </div>

          <div v-if="errorMsg" class="errbar"><text class="errbar-t">{{ errorMsg }}</text></div>
        </div>
      </div>
    </div>

    <div v-if="toast" class="toast"><text class="toast-t">{{ toast }}</text></div>

    <!-- 相册大图（可 2x 放大，双轴漫游） -->
    <div v-if="viewerOpen" class="viewer">
      <scroller class="vw-scroll-y" scroll-direction="vertical">
        <scroller class="vw-scroll-x" scroll-direction="horizontal">
          <image class="vw-img" :style="viewerImgStyle" :src="viewerSrc" resize="contain"></image>
        </scroller>
      </scroller>
      <div class="vw-top">
        <text class="vw-title">{{ viewerName }}</text>
        <div class="vw-btn" @click="closeViewer"><text class="vw-btn-t">关闭</text></div>
      </div>
      <div class="vw-bottom">
        <div class="vw-btn" @click="toggleViewerZoom"><text class="vw-btn-t">{{ viewerZoom ? '适应屏幕' : '放大 2×' }}</text></div>
      </div>
      <div v-if="viewerLoading" class="vw-loading"><text class="vw-loading-t">加载原图…</text></div>
    </div>

    <!-- 云端 chaty 聊天记录：左会话列表 / 右气泡对话 -->
    <div v-if="showChats" class="chat-ov">
      <div class="chat-head">
        <text class="chat-title">云端聊天</text>
        <text class="chat-sub">{{ chatSubText }}</text>
        <div class="chat-close" @click="closeChats"><text class="chat-close-t">关闭</text></div>
      </div>
      <div class="chat-body">
        <!-- 左：会话列表 -->
        <div class="conv-pane">
          <div class="conv-tools">
            <div :class="['chat-chip', chatType === '' ? 'chat-chip-on' : '']" @click="setChatType('')"><text :class="['chat-chip-t', chatType === '' ? 'chat-chip-t-on' : '']">全部</text></div>
            <div :class="['chat-chip', chatType === 'private' ? 'chat-chip-on' : '']" @click="setChatType('private')"><text :class="['chat-chip-t', chatType === 'private' ? 'chat-chip-t-on' : '']">私聊</text></div>
            <div :class="['chat-chip', chatType === 'group' ? 'chat-chip-on' : '']" @click="setChatType('group')"><text :class="['chat-chip-t', chatType === 'group' ? 'chat-chip-t-on' : '']">群聊</text></div>
            <input class="conv-input" type="text" :value="chatQuery" @input="onChatQueryInput" placeholder="关键词" />
            <div class="conv-search" @click="loadConvs(false)"><text class="conv-search-t">搜索</text></div>
          </div>
          <scroller class="conv-list" scroll-direction="vertical">
            <div v-for="c in chatConvs" :key="c.key"
                 :class="['conv-item', chatConv && chatConv.key === c.key ? 'conv-item-on' : '']"
                 @click="selectConv(c)">
              <div class="conv-r1">
                <text :class="['conv-tag', c.type === 'group' ? 'conv-tag-g' : 'conv-tag-p']">{{ c.type === 'group' ? '群' : '私' }}</text>
                <text class="conv-title">{{ c.title }}</text>
                <text class="conv-time">{{ fmtTime(c.last_time) }}</text>
              </div>
              <text class="conv-preview">{{ c.previewText }}</text>
              <text class="conv-sub">{{ c.sub }} · {{ c.count }} 条</text>
            </div>
            <div v-if="!chatLoading && chatConvs.length === 0" class="chat-empty">
              <text class="list-empty-t">没有命中会话</text>
            </div>
          </scroller>
        </div>

        <!-- 右：气泡对话 -->
        <div class="msg-pane">
          <div class="msg-head">
            <text class="msg-title">{{ chatConv ? chatConv.title : '选择左侧会话' }}</text>
            <text class="msg-sub">{{ chatConv ? (chatConv.sub + ' · 共 ' + chatConvTotal + ' 条') : '群聊 / 私聊均可' }}</text>
          </div>
          <div class="msg-tools">
            <div class="msg-btn" @click="loadOlder"><text class="msg-btn-t">{{ chatMoreLoading ? '加载中…' : (chatHasMore ? '加载更早' : '已到最早') }}</text></div>
            <div class="msg-btn" @click="reloadAllChats"><text class="msg-btn-t">刷新云端</text></div>
            <text class="msg-hint">{{ chatMsgsLoading ? '读取中…' : '' }}</text>
          </div>
          <scroller class="msg-scroll" scroll-direction="vertical">
            <div v-for="(m, i) in chatMessages" :key="m.seq || m.message_id"
                 :class="['msg-row', msgSide(m) === 'r' ? 'msg-row-r' : '']">
              <div :class="['msg-stack', msgSide(m) === 'r' ? 'msg-stack-r' : 'msg-stack-l']">
                <text v-if="showSender(m, i)" class="msg-who">{{ m.nickname || m.user_id }}</text>
                <div :class="['bubble', msgSide(m) === 'r' ? 'bubble-r' : 'bubble-l']">
                  <text :class="['bubble-t', msgSide(m) === 'r' ? 'bubble-t-r' : '']">{{ m.text }}</text>
                  <text :class="['bubble-time', msgSide(m) === 'r' ? 'bubble-time-r' : '']">{{ fmtTime(m.time) }}</text>
                </div>
              </div>
            </div>
            <div v-if="chatConv && !chatMsgsLoading && chatMessages.length === 0" class="chat-empty">
              <text class="list-empty-t">这个会话近 7 天没有记录</text>
            </div>
            <div v-if="!chatConv && !chatLoading" class="chat-empty">
              <text class="list-empty-t">左侧点一个会话看聊天</text>
            </div>
            <div ref="msgBottom" style="height:2px;"></div>
          </scroller>
        </div>
      </div>
    </div>

    <!-- 设置 -->
    <div v-if="showSettings" class="ov">
      <div class="sheet">
        <text class="sheet-title">连接设置</text>
        <text class="field-label">服务器地址</text>
        <input class="field-input" type="text" :value="draft.server" @input="onServerInput" placeholder="http://43.240.127.120:65" />
        <text class="field-label">管理口令</text>
        <input class="field-input" type="text" :value="draft.token" @input="onTokenInput" placeholder="pm_..." />
        <text class="field-hint">口令在服务端 /my/pro/api/data/penmgr.json。只授权「设备列表 / 抓帧」，不暴露 shell。</text>
        <div class="sheet-actions">
          <div class="sheet-btn" @click="showSettings = false"><text class="sheet-btn-t">取消</text></div>
          <div class="sheet-btn sheet-btn-accent" @click="saveSettings"><text class="sheet-btn-t sheet-btn-t-accent">保存并连接</text></div>
        </div>
      </div>
    </div>
  </div>
</template>


<script>
// 2026-11-07：服务器迁移，旧 43.248.133.189 下线
const DEFAULT_SERVER = 'http://43.240.127.120:65';
const OLD_SERVER_HOST = '43.248.133.189';
const DEFAULT_TOKEN = 'pm_ef9e6ae52f71ff42';
const CFG_KEY = 'penmgr_cfg';
const PAGE_SIZE = 8;
const AUTO_MS_SCREEN = 2000;
const AUTO_MS_CAMERA = 3000;

export default {
  data() {
    return {
      bridgeReady: false,
      Fetch: null,
      Dbase: null,

      cfg: { server: DEFAULT_SERVER, token: DEFAULT_TOKEN },
      draft: { server: DEFAULT_SERVER, token: DEFAULT_TOKEN },
      showSettings: false,

      devices: [],
      onlineCount: 0,
      totalCount: 0,
      loadingDevices: false,
      showOffline: false,
      page: 0,

      selected: null,
      kind: 'screen',
      rot: 0,

      imgSrc: '',
      shotLoading: false,
      auto: false,
      autoTimer: null,
      lastShotAt: 0,
      lastShotMs: 0,
      lastShotBytes: 0,

      // 相册
      albumItems: [],
      albumLoading: false,
      albumTotal: 0,
      albumOffset: 0,
      albumLimit: 24,
      albumViewDevice: '',
      viewerOpen: false,
      viewerName: '',
      viewerSrc: '',
      viewerLoading: false,
      viewerZoom: false,

      // 云端聊天记录（左会话列表 / 右气泡）
      showChats: false,
      chatType: '',
      chatQuery: '',
      chatConvs: [],
      chatConv: null,
      chatMessages: [],
      chatConvTotal: 0,
      chatHasMore: false,
      chatLoading: false,
      chatMsgsLoading: false,
      chatMoreLoading: false,
      chatServerTotal: 0,
      chatReqId: 0,

      serverOk: false,
      retriedOnce: false,
      statusText: '启动中…',
      errorMsg: '',
      toast: ''
    };
  },

  computed: {
    filteredDevices: function () {
      var out = [];
      for (var i = 0; i < this.devices.length; i++) {
        var d = this.devices[i];
        if (this.showOffline || d.online) out.push(d);
      }
      out.sort(function (a, b) {
        if (a.online !== b.online) return a.online ? -1 : 1;
        return String(a.nickname || '').localeCompare(String(b.nickname || ''));
      });
      return out;
    },
    pageCount: function () {
      return Math.max(1, Math.ceil(this.filteredDevices.length / PAGE_SIZE));
    },
    pagedDevices: function () {
      var start = this.page * PAGE_SIZE;
      return this.filteredDevices.slice(start, start + PAGE_SIZE);
    },
    stageHint: function () {
      if (!this.selected) return '左侧选择一台在线设备';
      if (this.auto) return '自动刷新中…';
      return '点右下角「抓一张」';
    },
    rotLabel: function () {
      return ['正', '右', '倒', '左'][this.rot] || '正';
    },
    shotInfoText: function () {
      if (!this.selected) return '在线 ' + this.onlineCount + ' 台 / 共 ' + this.totalCount + ' 台';
      if (!this.lastShotAt) return this.kind === 'screen' ? '屏幕快照' : '摄像头快照';
      var d = new Date(this.lastShotAt);
      var hh = ('0' + d.getHours()).slice(-2);
      var mm = ('0' + d.getMinutes()).slice(-2);
      var ss = ('0' + d.getSeconds()).slice(-2);
      var kb = Math.round((this.lastShotBytes || 0) / 102.4) / 10;
      return hh + ':' + mm + ':' + ss + ' · ' + this.lastShotMs + 'ms · ' + kb + 'KB';
    },
    albumPage: function () {
      return Math.floor(this.albumOffset / this.albumLimit);
    },
    albumPageCount: function () {
      return Math.max(1, Math.ceil(this.albumTotal / this.albumLimit));
    },
    albumRows: function () {
      var rows = [];
      var row = [];
      for (var i = 0; i < this.albumItems.length; i++) {
        row.push(this.albumItems[i]);
        if (row.length >= 4) { rows.push(row); row = []; }
      }
      if (row.length) rows.push(row);
      return rows;
    },
    viewerImgStyle: function () {
      // 笔上照片是 960x1706 竖图；底色按全屏高铺开，2x 时宽度翻倍横竖都能滚
      return this.viewerZoom
        ? { width: '936px', height: '1663px' }
        : { width: '468px', height: '832px' };
    },
    chatSubText: function () {
      if (this.chatLoading) return '读取云端记录中…（首次约 4 秒）';
      return '近 7 天 ' + this.chatServerTotal + ' 条 · ' + this.chatConvs.length + ' 个会话';
    }
  },

  mounted: function () {
    var self = this;
    // 注意：页面组件没有 this.setTimeout，必须用全局 setTimeout
    setTimeout(function () { self.initBridge(); }, 500);
  },

  beforeDestroy: function () {
    this.stopAuto();
  },

  methods: {
    onShow: function () {
      if (this.auto) this.startAuto();
    },
    onHide: function () {
      this.stopAuto();
    },

    initBridge: function () {
      this.statusText = '连接初始化…';
      try {
        var M = null;
        try { M = require('bridge'); } catch (e) {}
        if (!M && typeof bridge !== 'undefined') M = bridge;
        if (M) {
          if (M.Fetch) this.Fetch = M.Fetch;
          if (M.Datas) this.Dbase = M.Datas;
          else if (M.Dbase) this.Dbase = M.Dbase;
        }
      } catch (e) {}
      this.bridgeReady = !!this.Fetch;
      this.loadCfg();
      if (!this.Fetch) {
        this.statusText = '桥未就绪';
        this.errorMsg = '网络模块未加载，试试重新打开应用';
        return;
      }
      this.statusText = '拉取设备列表…';
      this.refreshDevices();
    },

    loadCfg: function () {
      var saved = null;
      try {
        if (this.Dbase) {
          saved = this.Dbase.read(CFG_KEY);
          if (typeof saved === 'string') saved = JSON.parse(saved);
        }
      } catch (e) { saved = null; }
      if (saved && typeof saved === 'object') {
        if (saved.server) {
          var sv = this.normalizeServer(saved.server);
          // 2026-11-07 服务器迁移：旧机器 IP 的存档自动改到新机，避免升级后仍连旧地址
          if (sv.indexOf(OLD_SERVER_HOST) >= 0) sv = DEFAULT_SERVER;
          this.cfg.server = sv;
        }
        if (saved.token) this.cfg.token = String(saved.token).trim();
      }
      this.draft.server = this.cfg.server;
      this.draft.token = this.cfg.token;
      // 首次启动：把默认连接参数写进本地库，下次直接可用
      if (!saved) {
        try {
          if (this.Dbase) this.Dbase.write(CFG_KEY, JSON.stringify(this.cfg));
        } catch (e) {}
      }
    },

    normalizeServer: function (v) {
      var s = String(v || '').trim();
      if (!s) return DEFAULT_SERVER;
      if (!/^https?:\/\//i.test(s)) s = 'http://' + s;
      return s.replace(/\/+$/, '');
    },

    openSettings: function () {
      this.draft.server = this.cfg.server;
      this.draft.token = this.cfg.token;
      this.showSettings = true;
    },

    onServerInput: function (e) {
      this.draft.server = e.value || (e.target && e.target.value) || (e.detail && e.detail.value) || '';
    },

    onTokenInput: function (e) {
      this.draft.token = e.value || (e.target && e.target.value) || (e.detail && e.detail.value) || '';
    },

    saveSettings: function () {
      this.cfg.server = this.normalizeServer(this.draft.server);
      this.cfg.token = String(this.draft.token || '').trim();
      try {
        if (this.Dbase) this.Dbase.write(CFG_KEY, JSON.stringify(this.cfg));
      } catch (e) {}
      this.showSettings = false;
      this.selected = null;
      this.imgSrc = '';
      this.retriedOnce = false;
      this.stopAuto();
      this.refreshDevices();
    },

    // 桥返回的响应形状在不同固件上不一致：text() 可能是同步字符串、可能是
    // Promise，也可能直接放在 body/_body/data 里。照 LoliAPP 里 foods/shop
    // 的兼容写法全部兜一遍，避免「服务端 200、页面却报解析失败」。
    resText: function (res) {
      if (!res) return '';
      if (typeof res === 'string') return res;
      if (res.data && typeof res.data === 'object') {
        try { return JSON.stringify(res.data); } catch (e) {}
      }
      if (typeof res.text === 'function') {
        try {
          var t = res.text();
          if (t && typeof t.then === 'function') return ''; // Promise 形态由 apiGet 处理
          if (t !== undefined && t !== null) return String(t);
        } catch (e) {}
      }
      if (typeof res.text === 'string') return res.text;
      if (typeof res.body === 'string') return res.body;
      if (typeof res._body === 'string') return res._body;
      if (typeof res.data === 'string') return res.data;
      return '';
    },

    apiGet: function (path, timeout) {
      if (!this.Fetch) return Promise.reject(new Error('桥未就绪'));
      var self = this;
      var sep = path.indexOf('?') >= 0 ? '&' : '?';
      // 口令同时走 header 和 query：部分固件的 bridge fetch 会丢自定义 header
      var url = this.cfg.server + path + sep + 'token=' + encodeURIComponent(this.cfg.token);
      return this.Fetch.fetch(url, {
        method: 'GET',
        timeout: timeout || 15,
        headers: { 'X-PenMgr-Token': this.cfg.token }
      }).then(function (res) {
        var consume = function (text) {
          var data = null;
          try { data = JSON.parse(String(text || '')); } catch (e) { data = null; }
          if (!data) {
            var head = String(text || '').replace(/\s+/g, ' ').slice(0, 80);
            throw new Error('响应不是 JSON' + (head ? '：' + head : '（空）'));
          }
          if (!data.ok) throw new Error(data.error || ('HTTP ' + (res && res.status)));
          return data;
        };
        var text = self.resText(res);
        if (!text && typeof res.text === 'function') {
          var maybe = res.text();
          if (maybe && typeof maybe.then === 'function') return maybe.then(consume);
        }
        return consume(text);
      });
    },

    refreshDevices: function () {
      var self = this;
      if (!this.Fetch || this.loadingDevices) return;
      this.loadingDevices = true;
      // 在线列表很小（~20 台）；只有切到「全部」才拉 894 台的全量
      this.apiGet('/penmgr/api/devices?online=' + (this.showOffline ? '0' : '1'), 12).then(function (data) {
        var d = data.data || {};
        self.devices = d.devices || [];
        self.onlineCount = d.online_count || 0;
        self.totalCount = d.total_count || 0;
        self.serverOk = true;
        self.statusText = self.onlineCount + ' 台在线';
        self.errorMsg = '';
        // 保留当前选择，设备列表对象换新后重新绑定
        if (self.selected) {
          var keep = null;
          for (var i = 0; i < self.devices.length; i++) {
            if (self.devices[i].token === self.selected.token) { keep = self.devices[i]; break; }
          }
          self.selected = keep;
          if (!keep) { self.imgSrc = ''; self.stopAuto(); }
        }
        // 不自动选中任何设备：抓帧只能由用户明确点选后触发，避免误抓其他笔
        self.clampPage();
      }).catch(function (err) {
        self.serverOk = false;
        self.statusText = '连接失败';
        var why = (err && err.message) ? err.message : String(err || '网络错误');
        self.errorMsg = '设备列表拉取失败（' + self.cfg.server + '）：' + why;
        // 首次加载偶发网络抖动：自动再来一次
        if (!self.retriedOnce) {
          self.retriedOnce = true;
          setTimeout(function () { self.refreshDevices(); }, 2500);
        }
      }).then(function () {
        self.loadingDevices = false;
      });
    },

    setOfflineFilter: function (v) {
      var was = this.showOffline;
      this.showOffline = !!v;
      this.page = 0;
      if (!this.showOffline && this.selected && !this.selected.online) {
        this.selected = null;
        this.imgSrc = '';
        this.stopAuto();
      }
      // 服务端默认只回在线设备；切到「全部」时重新拉全量
      if (was !== this.showOffline) {
        this.retriedOnce = false;
        this.refreshDevices();
      }
    },

    clampPage: function () {
      var max = Math.max(0, this.pageCount - 1);
      if (this.page > max) this.page = max;
    },

    prevPage: function () {
      this.page = Math.max(0, this.page - 1);
    },

    nextPage: function () {
      this.page = Math.min(this.pageCount - 1, this.page + 1);
    },

    selectDevice: function (d) {
      if (!d) return;
      if (!d.online) {
        this.showToast('设备已离线，无法抓帧');
        return;
      }
      if (this.selected && this.selected.token === d.token) return;
      this.selected = d;
      this.imgSrc = '';
      this.lastShotAt = 0;
      this.errorMsg = '';
      if (this.kind === 'album') {
        this.resetAlbum();
        this.loadAlbum(0);
        return;
      }
      this.takeShot(true);
    },

    setKind: function (k) {
      if (this.kind === k) return;
      this.kind = k;
      this.imgSrc = '';
      this.lastShotAt = 0;
      this.stopAuto();
      if (k === 'album') {
        if (!this.selected) {
          this.showToast('先选择一台在线设备');
          this.albumItems = [];
          this.albumTotal = 0;
          return;
        }
        if (this.albumViewDevice !== this.selected.token) {
          this.resetAlbum();
          this.loadAlbum(0);
        }
        return;
      }
      if (this.selected) this.takeShot(true);
    },

    rotateCamera: function () {
      this.rot = (this.rot + 1) % 4;
      if (this.selected && this.kind === 'camera') this.takeShot(true);
    },

    takeShot: function (manual) {
      var self = this;
      if (!this.Fetch || !this.selected || this.shotLoading) return;
      var dev = this.selected;
      if (!dev.online) {
        if (manual) this.showToast('设备已离线');
        this.stopAuto();
        return;
      }
      this.shotLoading = true;
      this.errorMsg = '';
      var path = '/penmgr/api/shot?device=' + encodeURIComponent(dev.token)
        + '&kind=' + this.kind + '&width=640&quality=5&rot=' + this.rot
        + '&_t=' + Date.now();
      this.apiGet(path, 35).then(function (data) {
        var payload = data.data || {};
        var b64 = payload.b64 || '';
        if (b64) {
          self.imgSrc = 'data:image/jpeg;base64,' + b64;
          self.lastShotAt = Date.now();
          self.lastShotMs = payload.ms || 0;
          self.lastShotBytes = payload.bytes || 0;
          self.serverOk = true;
        }
      }).catch(function (err) {
        var msg = err && err.message ? String(err.message) : '抓帧失败';
        if (msg === 'device_offline') msg = '设备已离线';
        else if (msg === 'capture_timeout') msg = '设备响应超时';
        else if (msg === 'forbidden') msg = '管理口令无效，请到设置里检查';
        self.errorMsg = msg;
        if (!manual) self.stopAuto();
      }).then(function () {
        self.shotLoading = false;
      });
    },

    // ---------------- 相册 ----------------

    resetAlbum: function () {
      this.albumItems = [];
      this.albumTotal = 0;
      this.albumOffset = 0;
      this.albumViewDevice = '';
      this.viewerOpen = false;
      this.viewerSrc = '';
      this.viewerName = '';
      this.viewerLoading = false;
      this.viewerZoom = false;
    },

    shortName: function (name) {
      var s = String(name || '');
      var m = s.match(/(\d{8})_(\d{6})/);
      if (m) {
        return m[1].slice(4, 6) + '-' + m[1].slice(6, 8) + ' '
          + m[2].slice(0, 2) + ':' + m[2].slice(2, 4);
      }
      return s.replace(/\.[^.]+$/, '');
    },

    loadAlbum: function (offset) {
      var self = this;
      if (!this.Fetch || !this.selected || this.albumLoading) return;
      var dev = this.selected;
      if (!dev.online) { this.showToast('设备已离线'); return; }
      this.albumLoading = true;
      this.albumOffset = Math.max(0, offset || 0);
      this.albumViewDevice = dev.token;
      this.albumItems = [];
      this.apiGet('/penmgr/api/album?device=' + encodeURIComponent(dev.token)
        + '&offset=' + this.albumOffset + '&limit=' + this.albumLimit
        + '&_t=' + Date.now(), 45).then(function (data) {
        var d = data.data || {};
        var items = d.items || [];
        for (var i = 0; i < items.length; i++) {
          items[i].thumb = '';
          items[i].shortName = self.shortName(items[i].name);
        }
        self.albumTotal = d.total || 0;
        self.albumItems = items;
        self.loadThumbs(items, dev.token);
      }).catch(function (err) {
        var msg = err && err.message ? String(err.message) : '相册读取失败';
        if (msg === 'device_offline') msg = '设备已离线';
        else if (msg === 'album_timeout') msg = '相册读取超时';
        self.showToast(msg);
      }).then(function () {
        self.albumLoading = false;
      });
    },

    // 缩略图按 8 张一批串行拉：一次 PTY 里批量转码，避免 24 条请求排队把笔打满
    loadThumbs: function (items, device) {
      var self = this;
      var pending = [];
      for (var i = 0; i < (items || []).length; i++) {
        if (items[i] && items[i].name) pending.push(items[i]);
      }
      var idx = 0;
      var step = function () {
        if (idx >= pending.length) return;
        var chunk = pending.slice(idx, idx + 8);
        idx += chunk.length;
        var names = [];
        for (var j = 0; j < chunk.length; j++) names.push(chunk[j].name);
        self.apiGet('/penmgr/api/album/thumbs?device=' + encodeURIComponent(device)
          + '&names=' + encodeURIComponent(names.join('|')), 90)
          .catch(function () { return null; })
          .then(function (data) {
            var got = (data && data.data && data.data.items) || {};
            for (var k = 0; k < self.albumItems.length; k++) {
              var it = self.albumItems[k];
              if (it && got[it.name]) it.thumb = 'data:image/jpeg;base64,' + got[it.name];
            }
          }).then(function () { step(); });
      };
      step();
    },

    refreshAlbum: function () {
      if (!this.selected) { this.showToast('先选择一台在线设备'); return; }
      this.loadAlbum(this.albumOffset);
    },

    albumPrev: function () {
      if (this.albumLoading || this.albumOffset <= 0) return;
      this.loadAlbum(Math.max(0, this.albumOffset - this.albumLimit));
    },

    albumNext: function () {
      if (this.albumLoading) return;
      if (this.albumOffset + this.albumLimit >= this.albumTotal) return;
      this.loadAlbum(this.albumOffset + this.albumLimit);
    },

    openViewer: function (it) {
      var self = this;
      if (!it || !it.name || !this.selected) return;
      this.viewerOpen = true;
      this.viewerName = it.name;
      this.viewerSrc = it.thumb || '';
      this.viewerZoom = false;
      this.viewerLoading = true;
      this.apiGet('/penmgr/api/album/item?device=' + encodeURIComponent(this.selected.token)
        + '&name=' + encodeURIComponent(it.name) + '&width=1920', 60)
        .then(function (data) {
          var b64 = (data.data && data.data.b64) || '';
          if (b64) self.viewerSrc = 'data:image/jpeg;base64,' + b64;
        }).catch(function (err) {
          var msg = err && err.message ? String(err.message) : '原图读取失败';
          if (msg === 'device_offline') msg = '设备已离线';
          self.showToast(msg);
        }).then(function () {
          self.viewerLoading = false;
        });
    },

    closeViewer: function () {
      this.viewerOpen = false;
      this.viewerSrc = '';
      this.viewerName = '';
      this.viewerZoom = false;
      this.viewerLoading = false;
    },

    toggleViewerZoom: function () {
      this.viewerZoom = !this.viewerZoom;
    },

    // ---------------- 云端 chaty 聊天记录 ----------------

    openChats: function () {
      this.showChats = true;
      if (this.chatConvs.length === 0) this.loadConvs(false);
    },

    closeChats: function () {
      this.showChats = false;
    },

    onChatQueryInput: function (e) {
      this.chatQuery = e.value || (e.target && e.target.value) || (e.detail && e.detail.value) || '';
    },

    setChatType: function (t) {
      if (this.chatType === t) return;
      this.chatType = t;
      this.loadConvs(false);
    },

    cleanPreview: function (s) {
      // 服务端预览会截到 160 字，CQ 码可能被截断没有右括号，所以都写成 ]? 可选
      return String(s || '')
        .replace(/\[CQ:image[^\]]*\]?/g, '[图片]')
        .replace(/\[CHATY_MEME:[^\]]*\]?/g, '[表情]')
        .replace(/\[CQ:[^\]]*\]?/g, '[消息]')
        .replace(/\s+/g, ' ')
        .trim();
    },

    // 会话列表：服务端把近 7 天记录按「群 / 私聊两人」聚合，缓存在服务端 30s
    loadConvs: function (force) {
      var self = this;
      if (!this.Fetch || this.chatLoading) return;
      this.chatLoading = true;
      var path = '/penmgr/api/convs?type=' + encodeURIComponent(this.chatType)
        + '&q=' + encodeURIComponent(this.chatQuery)
        + (force ? '&force=1' : '')
        + '&_t=' + Date.now();
      this.apiGet(path, 60).then(function (data) {
        var d = data.data || {};
        var convs = d.convs || [];
        for (var i = 0; i < convs.length; i++) {
          convs[i].previewText = self.cleanPreview(convs[i].last_preview) || '（无文字内容）';
        }
        self.chatConvs = convs;
        self.chatServerTotal = d.records || 0;
        var keep = null;
        if (self.chatConv) {
          for (var j = 0; j < convs.length; j++) {
            if (convs[j].key === self.chatConv.key) { keep = convs[j]; break; }
          }
        }
        if (!keep && convs.length) keep = convs[0];
        if (keep) {
          self.chatConv = keep;
          self.loadConv(keep.key, 0, false);
        } else {
          self.chatConv = null;
          self.chatMessages = [];
          self.chatConvTotal = 0;
          self.chatHasMore = false;
        }
      }).catch(function (err) {
        var msg = err && err.message ? String(err.message) : '会话列表读取失败';
        if (msg === 'chaty_unavailable') msg = 'chaty 服务不可用';
        if (msg === 'admin_token_missing') msg = '服务端未配置 chaty 管理令牌';
        self.showToast(msg);
      }).then(function () {
        self.chatLoading = false;
      });
    },

    selectConv: function (c) {
      if (!c) return;
      if (this.chatConv && this.chatConv.key === c.key && this.chatMessages.length) return;
      this.chatConv = c;
      this.chatConvTotal = c.count || 0;
      this.chatHasMore = false;
      this.chatMessages = [];
      this.loadConv(c.key, 0, false);
    },

    // beforeSeq=0 取最新一页；append=true 时把更早一页拼到顶部
    loadConv: function (key, beforeSeq, append, beforeTs) {
      var self = this;
      if (!this.Fetch) return;
      var rid = (this.chatReqId || 0) + 1;
      this.chatReqId = rid;
      this.chatMsgsLoading = true;
      if (append) this.chatMoreLoading = true;
      var path = '/penmgr/api/conv?key=' + encodeURIComponent(key) + '&limit=80'
        + (beforeSeq ? '&before_seq=' + beforeSeq : '')
        + (beforeTs ? '&before_ts=' + beforeTs : '')
        + '&_t=' + Date.now();
      this.apiGet(path, 45).then(function (data) {
        if (rid !== self.chatReqId) return;
        var d = data.data || {};
        var rs = d.records || [];
        for (var i = 0; i < rs.length; i++) {
          rs[i].text = self.cleanPreview(rs[i].preview).slice(0, 800) || '（无文字内容）';
        }
        if (append) {
          var seen = {};
          for (var a = 0; a < self.chatMessages.length; a++) {
            seen[self.chatMessages[a].seq || self.chatMessages[a].message_id] = 1;
          }
          var merged = [];
          for (var b = 0; b < rs.length; b++) {
            var mk = rs[b].seq || rs[b].message_id;
            if (!seen[mk]) { seen[mk] = 1; merged.push(rs[b]); }
          }
          self.chatMessages = merged.concat(self.chatMessages);
        } else {
          self.chatMessages = rs;
        }
        self.chatConvTotal = d.total || (append ? self.chatConvTotal : rs.length);
        self.chatHasMore = !!d.has_more;
        // 新会话/刷新后滚到最新一条（加载更早时保持当前位置）
        if (!append) self.scrollChatToBottom();
      }).catch(function (err) {
        if (rid !== self.chatReqId) return;
        self.showToast(err && err.message ? String(err.message) : '会话读取失败');
      }).then(function () {
        if (rid !== self.chatReqId) return;
        self.chatMsgsLoading = false;
        self.chatMoreLoading = false;
      });
    },

    loadOlder: function () {
      if (!this.chatConv || this.chatMoreLoading || !this.chatHasMore || !this.chatMessages.length) return;
      var first = this.chatMessages[0];
      this.loadConv(this.chatConv.key, first.seq || first.message_id, true, first.time || 0);
    },

    reloadAllChats: function () {
      if (!this.Fetch || this.chatLoading) return;
      this.loadConvs(true);
    },

    // 滚到最新一条：用底部锚点 + 原生 scrollToElement（布局未稳时静默失败，重试兜底）
    scrollChatToBottom: function () {
      var self = this;
      var run = function () {
        try {
          var refs = self.$refs.msgBottom;
          var el = Array.isArray(refs) ? refs[0] : refs;
          if (!el || !self.$page || !self.$page.$dom) return;
          self.$page.$dom.scrollToElement(el, { offset: 0 });
        } catch (e) {}
      };
      setTimeout(run, 80);
      setTimeout(run, 450);
    },

    msgSide: function (m) {
      // 私聊按会话里的两位用户分左右；群聊统一左侧带头像位
      if (!this.chatConv || this.chatConv.type !== 'private') return 'l';
      return String(m.user_id || '') === String(this.chatConv.a || '') ? 'l' : 'r';
    },

    showSender: function (m, i) {
      if (i === 0) return true;
      var prev = this.chatMessages[i - 1];
      if (!prev) return true;
      return String(prev.user_id || '') !== String(m.user_id || '');
    },

    fmtTime: function (ts) {
      var n = Number(ts) || 0;
      if (!n) return '';
      var d = new Date(n * 1000);
      var MM = ('0' + (d.getMonth() + 1)).slice(-2);
      var DD = ('0' + d.getDate()).slice(-2);
      var hh = ('0' + d.getHours()).slice(-2);
      var mm = ('0' + d.getMinutes()).slice(-2);
      return MM + '-' + DD + ' ' + hh + ':' + mm;
    },

    toggleAuto: function () {
      if (this.auto) { this.stopAuto(); return; }
      if (!this.selected) { this.showToast('先选择一台在线设备'); return; }
      this.auto = true;
      this.startAuto();
      this.takeShot(true);
    },

    startAuto: function () {
      this.stopAuto();
      var self = this;
      var ms = this.kind === 'camera' ? AUTO_MS_CAMERA : AUTO_MS_SCREEN;
      this.autoTimer = setInterval(function () {
        if (!self.auto) { self.stopAuto(); return; }
        self.takeShot(false);
      }, ms);
    },

    stopAuto: function () {
      this.auto = false;
      if (this.autoTimer) {
        clearInterval(this.autoTimer);
        this.autoTimer = null;
      }
    },

    batteryText: function (d) {
      var b = d && d.battery;
      if (b === null || b === undefined || b < 0) return '';
      var t = b + '%';
      if (d.battery_status === 'charging' || d.battery_status === 'charging_usb') t = '充 ' + t;
      return t;
    },

    deviceStatus: function (d) {
      if (!d.online) return '离线';
      var act = d.activity_status || '';
      if (act) return act;
      return d.client_version ? ('在线 · ' + d.client_version) : '在线';
    },

    showToast: function (msg) {
      var self = this;
      this.toast = msg;
      if (this.toastTimer) clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(function () { self.toast = ''; }, 2200);
    }
  }
};
</script>

<style>
/* ===== doge-reader 设计语言（对齐 LoliMedia 小说页）：深色双表面 + 深蓝强调 =====
   Weex 约束：单类名选择器、长手样式、lines 为伪属性 */
.app {
  flex: 1;
  height: 100%;
  flex-direction: row;
  background-color: #080a0c;
}

/* ── 左侧图标竖栏 ── */
.rail {
  width: 56px;
  padding-top: 8px;
  align-items: center;
  background-color: #080a0c;
}
.rail-logo {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: #004a77;
  justify-content: center;
  align-items: center;
  margin-bottom: 10px;
}
.rail-logo-t { color: #c2e7ff; font-size: 20px; font-weight: bold; }
.rail-btn {
  width: 40px;
  height: 38px;
  border-radius: 14px;
  background-color: #111216;
  justify-content: center;
  align-items: center;
  margin-bottom: 4px;
}
.rail-btn:active { opacity: 0.6; }
.rail-btn-on { background-color: #004a77; }
.rail-glyph { font-size: 20px; color: #8e918f; }
.rail-glyph-on { color: #c2e7ff; font-weight: bold; }
.rail-spacer { flex: 1; }
.rail-status { height: 20px; justify-content: center; align-items: center; }
.rail-dot { width: 9px; height: 9px; border-radius: 5px; }
.rail-dot-on { background-color: #37d67a; }
.rail-dot-off { background-color: #d64545; }

/* ── 主内容列 ── */
.content {
  flex: 1;
  flex-direction: column;
  padding-left: 4px;
  padding-right: 16px;
  padding-top: 8px;
  padding-bottom: 8px;
}
.title-area {
  height: 44px;
  flex-direction: row;
  align-items: center;
}
.page-title {
  font-size: 26px;
  color: #8e918f;
  margin-right: 15px;
}
.title-sub { font-size: 16px; color: #8e918f; }
.title-spacer { flex: 1; }
.pill-btn {
  background-color: #004a77;
  border-radius: 21px;
  padding-top: 6px;
  padding-bottom: 6px;
  padding-left: 18px;
  padding-right: 18px;
  margin-left: 10px;
  justify-content: center;
  align-items: center;
}
.pill-btn:active { opacity: 0.6; }
.pill-btn-t { font-size: 16px; color: #c2e7ff; font-weight: bold; }
.pill-ghost {
  background-color: #1a1b1f;
  border-radius: 21px;
  padding-top: 6px;
  padding-bottom: 6px;
  padding-left: 16px;
  padding-right: 16px;
  margin-left: 8px;
  justify-content: center;
  align-items: center;
}
.pill-ghost:active { opacity: 0.6; }
.pill-ghost-t { font-size: 16px; color: #e3e3e3; }

.body { flex: 1; flex-direction: row; }

/* ── 设备卡片列 ── */
.side {
  width: 248px;
  flex-direction: column;
  margin-right: 10px;
  padding-left: 8px;
  padding-right: 8px;
  padding-top: 4px;
  border-radius: 21px;
  background-color: #111216;
}
.side-head {
  height: 32px;
  flex-direction: row;
  align-items: center;
}
.chip {
  height: 24px;
  padding-left: 10px;
  padding-right: 10px;
  margin-right: 6px;
  border-radius: 12px;
  background-color: #1a1b1f;
  justify-content: center;
  align-items: center;
}
.chip-on { background-color: #004a77; }
.chip:active { opacity: 0.6; }
.chip-t { color: #8e918f; font-size: 13px; }
.chip-t-on { color: #c2e7ff; font-weight: bold; }
.side-spacer { flex: 1; }
.pager-mini { flex-direction: row; align-items: center; }
.side-loading { color: #8e918f; font-size: 13px; margin-left: 6px; }

.dev-scroll { flex: 1; }
.dev-item {
  flex-direction: row;
  align-items: center;
  background-color: #1a1b1f;
  border-radius: 16px;
  padding-left: 8px;
  padding-right: 10px;
  padding-top: 6px;
  padding-bottom: 6px;
  margin-bottom: 5px;
  animation: fade-in-up 0.35s ease-out 1;
}
.dev-item:active { opacity: 0.6; }
.dev-ava {
  width: 30px;
  height: 30px;
  border-radius: 15px;
  background-color: #10344f;
  justify-content: center;
  align-items: center;
}
.dev-ava-on { background-color: #c2e7ff; }
.dev-ava-t { color: #c2e7ff; font-size: 14px; font-weight: bold; }
.dev-ava-t-on { color: #004a77; }
.dev-info { flex: 1; margin-left: 10px; }
.dev-live { width: 8px; height: 8px; border-radius: 4px; margin-left: 6px; }
.dev-live-on { background-color: #37d67a; }
.dev-live-off { background-color: #4a4f55; }
.dev-item-on { background-color: #004a77; }
.dev-item-off { opacity: 0.55; }
.dev-r1 {
  flex-direction: row;
  align-items: center;
  margin-bottom: 3px;
}
.dev-name {
  flex: 1;
  color: #e3e3e3;
  font-size: 15px;
  font-weight: bold;
  lines: 1;
  text-overflow: ellipsis;
}
.dev-bat { color: #9fb3c8; font-size: 11px; }
.dev-r2 { flex-direction: row; align-items: center; }
.dev-id { flex: 1; color: #9fb3c8; font-size: 11px; }
.dev-st { color: #9fb3c8; font-size: 11px; }
.dev-r3 { flex-direction: row; align-items: center; margin-top: 2px; }
.dev-ip { color: #7d93a8; font-size: 10px; margin-right: 6px; }
.dev-loc {
  flex: 1;
  color: #7fe0c8;
  font-size: 10px;
  lines: 1;
  text-overflow: ellipsis;
  text-align: right;
}
.list-empty { padding-top: 30px; align-items: center; }
.list-empty-t { color: #8e918f; font-size: 16px; }

.pager {
  height: 24px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
}
.pg-btn {
  width: 24px;
  height: 22px;
  justify-content: center;
  align-items: center;
  border-radius: 11px;
  background-color: #1a1b1f;
}
.pg-btn:active { opacity: 0.6; }
.pg-t { color: #c2e7ff; font-size: 15px; }
.pg-num { color: #8e918f; font-size: 12px; margin-left: 6px; margin-right: 6px; }

/* ── 右侧取景 ── */
.main {
  flex: 1;
  flex-direction: column;
  background-color: #0d0e11;
  border-radius: 21px;
  padding-left: 10px;
  padding-right: 10px;
  padding-top: 5px;
  padding-bottom: 4px;
}
.vdev {
  flex-direction: row;
  align-items: center;
  margin-right: 6px;
}
.vdev-name {
  color: #e3e3e3;
  font-size: 16px;
  font-weight: bold;
  lines: 1;
  text-overflow: ellipsis;
  max-width: 110px;
}
.vdev-sub {
  color: #8e918f;
  font-size: 12px;
  margin-left: 8px;
  lines: 1;
  text-overflow: ellipsis;
  max-width: 190px;
}
.vh-tabs { flex-direction: row; align-items: center; }
.vh-tab {
  height: 26px;
  padding-left: 12px;
  padding-right: 12px;
  margin-left: 7px;
  border-radius: 13px;
  background-color: #1a1b1f;
  justify-content: center;
  align-items: center;
}
.vh-tab:active { opacity: 0.6; }
.vh-tab-on { background-color: #004a77; }
.vh-tab-t { color: #8e918f; font-size: 14px; }
.vh-tab-t-on { color: #c2e7ff; font-weight: bold; }

.stage {
  flex: 1;
  border-radius: 14px;
  background-color: #000000;
  border-width: 1px;
  border-color: #232428;
  justify-content: center;
  align-items: center;
}
.stage-img { width: 100%; height: 100%; }
.stage-hint { color: #6b6e72; font-size: 16px; }
.stage-loading {
  position: absolute;
  right: 14px;
  top: 12px;
  padding-left: 12px;
  padding-right: 12px;
  height: 25px;
  border-radius: 13px;
  background-color: rgba(0, 0, 0, 0.6);
  justify-content: center;
  align-items: center;
}
.stage-loading-t { color: #c2e7ff; font-size: 13px; }

.view-bar {
  height: 36px;
  flex-direction: row;
  align-items: center;
}
.vb-info { flex: 1; color: #8e918f; font-size: 14px; lines: 1; text-overflow: ellipsis; }
.vb-btns { flex-direction: row; align-items: center; }
.vb-btn {
  height: 28px;
  padding-left: 15px;
  padding-right: 15px;
  margin-left: 7px;
  border-radius: 14px;
  background-color: #1a1b1f;
  justify-content: center;
  align-items: center;
}
.vb-btn:active { opacity: 0.6; }
.vb-btn-on { background-color: #7a4b00; }
.vb-btn-accent { background-color: #004a77; }
.vb-btn-t { color: #c2e7ff; font-size: 14px; }
.vb-btn-t-on { color: #ffcf7a; }
.vb-btn-t-accent { color: #ffffff; font-weight: bold; }

.errbar { height: 24px; justify-content: center; }
.errbar-t { color: #ff8a8a; font-size: 13px; }

/* ── 设置弹层 ── */
.ov {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.66);
  justify-content: center;
  align-items: center;
}
.sheet {
  width: 460px;
  padding: 20px;
  border-radius: 21px;
  background-color: #1a1b1f;
}
.sheet-title { color: #e3e3e3; font-size: 22px; font-weight: bold; margin-bottom: 12px; }
.field-label { color: #8e918f; font-size: 14px; margin-top: 10px; margin-bottom: 5px; }
.field-input {
  height: 34px;
  padding-left: 12px;
  padding-right: 12px;
  border-radius: 12px;
  background-color: #111216;
  color: #e3e3e3;
  font-size: 15px;
}
.field-hint { color: #6b6e72; font-size: 12px; margin-top: 10px; line-height: 18px; }
.sheet-actions { flex-direction: row; justify-content: flex-end; margin-top: 16px; }
.sheet-btn {
  height: 32px;
  padding-left: 20px;
  padding-right: 20px;
  margin-left: 10px;
  border-radius: 16px;
  background-color: #111216;
  justify-content: center;
  align-items: center;
}
.sheet-btn:active { opacity: 0.6; }
.sheet-btn-accent { background-color: #004a77; }
.sheet-btn-t { color: #c2e7ff; font-size: 15px; }
.sheet-btn-t-accent { color: #ffffff; font-weight: bold; }

/* ── 相册 ── */
.album-scroll { flex: 1; width: 100%; height: 100%; padding: 8px; }
.album-row { flex-direction: row; justify-content: flex-start; }
.album-cell { width: 220px; margin: 3px; }
.album-cell:active { opacity: 0.7; }
.album-thumb {
  width: 210px;
  height: 94px;
  border-radius: 12px;
  background-color: #111216;
}
.album-ph {
  width: 210px;
  height: 94px;
  border-radius: 12px;
  background-color: #1a1b1f;
  justify-content: center;
  align-items: center;
}
.album-ph-t { color: #6b6e72; font-size: 16px; }
.album-name { color: #8e918f; font-size: 12px; margin-top: 2px; }
.album-empty { padding-top: 40px; align-items: center; }

/* ── 大图 ── */
.viewer {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background-color: #000000;
  flex-direction: column;
}
.vw-scroll-y { flex: 1; width: 100%; margin-top: 38px; margin-bottom: 40px; }
.vw-scroll-x { width: 100%; height: 100%; }
.vw-img { background-color: #000000; }
.vw-top {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 38px;
  flex-direction: row;
  align-items: center;
  padding-left: 16px;
  padding-right: 12px;
  background-color: rgba(0, 0, 0, 0.7);
}
.vw-title { flex: 1; color: #e3e3e3; font-size: 16px; }
.vw-btn {
  height: 28px;
  padding-left: 16px;
  padding-right: 16px;
  border-radius: 14px;
  background-color: #004a77;
  justify-content: center;
  align-items: center;
}
.vw-btn:active { opacity: 0.6; }
.vw-btn-t { color: #c2e7ff; font-size: 14px; }
.vw-bottom {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 40px;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.7);
}
.vw-loading { position: absolute; left: 0; right: 0; top: 42%; align-items: center; }
.vw-loading-t {
  color: #c2e7ff;
  font-size: 15px;
  background-color: rgba(0, 0, 0, 0.75);
  padding-top: 7px;
  padding-bottom: 7px;
  padding-left: 18px;
  padding-right: 18px;
  border-radius: 16px;
}

/* ── 云端聊天：左会话 / 右气泡 ── */
.chat-ov {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background-color: #080a0c;
  flex-direction: column;
}
.chat-head {
  height: 46px;
  flex-direction: row;
  align-items: center;
  padding-left: 20px;
  padding-right: 14px;
}
.chat-title { color: #8e918f; font-size: 26px; margin-right: 15px; }
.chat-sub { flex: 1; color: #8e918f; font-size: 16px; lines: 1; text-overflow: ellipsis; }
.chat-close {
  height: 30px;
  padding-left: 18px;
  padding-right: 18px;
  border-radius: 15px;
  background-color: #1a1b1f;
  justify-content: center;
  align-items: center;
}
.chat-close:active { opacity: 0.6; }
.chat-close-t { color: #c2e7ff; font-size: 15px; }
.chat-body { flex: 1; flex-direction: row; padding-left: 14px; padding-right: 14px; padding-bottom: 10px; }

/* 左：会话列表 */
.conv-pane {
  width: 352px;
  height: 100%;
  flex-direction: column;
  margin-right: 12px;
}
.conv-tools {
  height: 38px;
  flex-direction: row;
  align-items: center;
  margin-bottom: 4px;
}
.chat-chip {
  height: 26px;
  padding-left: 14px;
  padding-right: 14px;
  margin-right: 6px;
  border-radius: 13px;
  background-color: #1a1b1f;
  justify-content: center;
  align-items: center;
}
.chat-chip:active { opacity: 0.6; }
.chat-chip-on { background-color: #004a77; }
.chat-chip-t { color: #8e918f; font-size: 14px; }
.chat-chip-t-on { color: #c2e7ff; font-weight: bold; }
.conv-input {
  flex: 1;
  height: 28px;
  margin-right: 6px;
  padding-left: 10px;
  padding-right: 10px;
  border-radius: 14px;
  background-color: #111216;
  color: #e3e3e3;
  font-size: 14px;
}
.conv-search {
  height: 28px;
  padding-left: 16px;
  padding-right: 16px;
  border-radius: 14px;
  background-color: #004a77;
  justify-content: center;
  align-items: center;
}
.conv-search:active { opacity: 0.6; }
.conv-search-t { color: #c2e7ff; font-size: 14px; }
.conv-list { flex: 1; }
.conv-item {
  background-color: #1a1b1f;
  border-radius: 16px;
  padding-top: 8px;
  padding-bottom: 8px;
  padding-left: 12px;
  padding-right: 12px;
  margin-bottom: 7px;
  animation: fade-in-up 0.3s ease-out 1;
}
.conv-item:active { opacity: 0.6; }
.conv-item-on { background-color: #004a77; }
.conv-r1 { flex-direction: row; align-items: center; margin-bottom: 2px; }
.conv-tag {
  height: 20px;
  padding-left: 6px;
  padding-right: 6px;
  margin-right: 7px;
  border-radius: 10px;
  font-size: 12px;
  text-align: center;
}
.conv-tag-p { background-color: #10344f; color: #c2e7ff; }
.conv-tag-g { background-color: #6b4a10; color: #ffcf7a; }
.conv-title {
  flex: 1;
  color: #e3e3e3;
  font-size: 17px;
  font-weight: bold;
  lines: 1;
  text-overflow: ellipsis;
}
.conv-time { color: #8e918f; font-size: 12px; margin-left: 6px; }
.conv-preview { color: #8e918f; font-size: 14px; margin-top: 2px; lines: 1; text-overflow: ellipsis; }
.conv-sub { color: #6b6e72; font-size: 12px; margin-top: 2px; }

/* 右：气泡 */
.msg-pane {
  flex: 1;
  height: 100%;
  flex-direction: column;
  background-color: #0d0e11;
  border-radius: 21px;
  padding-left: 14px;
  padding-right: 14px;
}
.msg-head {
  height: 42px;
  flex-direction: row;
  align-items: center;
}
.msg-title {
  color: #e3e3e3;
  font-size: 20px;
  font-weight: bold;
  margin-right: 12px;
  lines: 1;
  text-overflow: ellipsis;
}
.msg-sub { flex: 1; color: #8e918f; font-size: 13px; }
.msg-tools {
  height: 34px;
  flex-direction: row;
  align-items: center;
  margin-bottom: 2px;
}
.msg-btn {
  height: 26px;
  padding-left: 14px;
  padding-right: 14px;
  margin-right: 8px;
  border-radius: 13px;
  background-color: #1a1b1f;
  justify-content: center;
  align-items: center;
}
.msg-btn:active { opacity: 0.6; }
.msg-btn-t { color: #c2e7ff; font-size: 13px; }
.msg-hint { flex: 1; color: #6b6e72; font-size: 13px; }
.msg-scroll {
  flex: 1;
  padding-left: 4px;
  padding-right: 4px;
  padding-top: 4px;
  padding-bottom: 8px;
}
.msg-row { flex-direction: row; margin-bottom: 10px; }
.msg-row-r { justify-content: flex-end; }
.msg-stack { flex-direction: column; max-width: 72%; }
.msg-stack-l { align-items: flex-start; }
.msg-stack-r { align-items: flex-end; }
.msg-who { color: #8e918f; font-size: 12px; margin-bottom: 3px; margin-left: 4px; }
.bubble {
  padding-top: 8px;
  padding-bottom: 6px;
  padding-left: 12px;
  padding-right: 12px;
  flex-direction: column;
  border-radius: 18px;
}
.bubble-l { background-color: #1a1b1f; }
.bubble-r { background-color: #004a77; }
.bubble-t { color: #e3e3e3; font-size: 15px; line-height: 21px; }
.bubble-t-r { color: #ffffff; }
.bubble-time { color: #8e918f; font-size: 11px; margin-top: 3px; align-self: flex-end; }
.bubble-time-r { color: #a9d3f0; }
.chat-empty { padding-top: 40px; align-items: center; }

.toast {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 26px;
  align-items: center;
}
.toast-t {
  color: #e3e3e3;
  font-size: 14px;
  background-color: rgba(26, 27, 31, 0.95);
  padding-top: 7px;
  padding-bottom: 7px;
  padding-left: 18px;
  padding-right: 18px;
  border-radius: 16px;
}

@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
