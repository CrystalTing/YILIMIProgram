//app.js
App({
  onLaunch: function () {
    //若用户已登录，读取信息
    if (this.globalData.userInfo == null){
      this.globalData.userInfo = wx.getStorageSync('userInfo')
    }
    console.log(this.globalData)

    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.wechatUserInfo = res.userInfo

              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
      }
    })
  },
  // editTabBar: function () { //动态设置底部导航栏
  //   var _curPageArr = getCurrentPages();
  //   var _curPage = _curPageArr[_curPageArr.length - 1];
  //   var _pagePath = _curPage.__route__;
  //   if (_pagePath.indexOf('/') != 0) {
  //     _pagePath = '/' + _pagePath;
  //   }
  //   var tabBar = this.globalData.tabBar;
  //   for (var i = 0; i < tabBar.list.length; i++) {
  //     tabBar.list[i].active = false;
  //     if (tabBar.list[i].pagePath == _pagePath) {
  //       tabBar.list[i].active = true;//根据页面地址设置当前页面状态  
  //     }
  //   }
  //   _curPage.setData({
  //     tabBar: tabBar
  //   });
  // },

  globalData: {
    wechatUserInfo: null,
    userInfo: null,
    userInfoList:[],
    // serverAddress: "http://localhost:8080",
    // serverAddress: "http://47.102.123.129",
    // serverAddress: "http://www.aero-trust.net",
    // serverAddress: "http://39.100.39.26",
    serverAddress: "https://j2j5776485.wicp.vip",
    useFakeData: false,
    // tabBar1: {  //售后人员的底部导航栏
    //   "borderStyle": "black",
    //   "backgroundColor": "#ffffff",
    //   "list": [
    //     {
    //       "pagePath": "pages/homepage/homepage",
    //       "text": "流程参与",
    //       "iconPath": "images/homepage/process.png",
    //       "selectedIconPath": "images/homepage/process_active.png",
    //       active: true,
    //     },
    //     {
    //       "pagePath": "pages/interaction/interaction",
    //       "text": "反馈互动记录",
    //       "iconPath": "images/homepage/interaction.png",
    //       "selectedIconPath": "images/homepage/interaction_active.png",
    //       active: false,
    //     },
    //     {
    //       "pagePath": "pages/profile/profile",
    //       "text": "我",
    //       "iconPath": "images/homepage/user.png",
    //       "selectedIconPath": "images/homepage/user_active.png",
    //       active: false,
    //     }
    //   ]
    // },
    // tabBar2: {  //其他角色的底部导航栏
    //   "borderStyle": "black",
    //   "backgroundColor": "#ffffff",
    //   "list": [
    //     {
    //       "pagePath": "pages/homepage/homepage",
    //       "text": "流程参与",
    //       "iconPath": "images/homepage/process.png",
    //       "selectedIconPath": "images/homepage/process_active.png",
    //       active: true,
    //     },
    //     {
    //       "pagePath": "pages/profile/profile",
    //       "text": "我",
    //       "iconPath": "images/homepage/user.png",
    //       "selectedIconPath": "images/homepage/user_active.png",
    //       active: false,
    //     }
    //   ]
    // }
  }
})