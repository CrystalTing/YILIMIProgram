// pages/outwarehouse/outwarehouse.js
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,             //用户信息

    processInstances: null,     //正在运行的项目实例

    loadingCompleted: false,  //页面加载完成
  },

  //注销账号
  logout: function (obj) {
    delete app.globalData.userInfo
    wx.removeStorageSync('userInfo')

    wx.redirectTo({
      url: '../login/login',
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    //若未登录，重定向至登录页面
    if (app.globalData.userInfo == null || app.globalData.userInfo == '') {
      return
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    //若未登录，重定向至登录页面
    if (app.globalData.userInfo == null || app.globalData.userInfo == '') {
      wx.redirectTo({
        url: '../login/login',
      })
      return
    }
    if (!(app.globalData.userInfo.rolesStr.includes("安装员") || app.globalData.userInfo.rolesStr.includes("库管员"))) { //只允许安装员或库管员查看该页面
      this.setData({
        userInfo: app.globalData.userInfo,
        loadingCompleted: true,
        notInstallerOrWarehouseman: true
      })
      return
    }
    
    //页面加载中
    wx.showLoading({
      title: "加载中"
    })
    this.setData({
      userInfo: app.globalData.userInfo,
      processes: null,
      loadingCompleted: false,
    })

    //请求获取所有正在运行中的流程实例
    var that = this
    var requestData = {
      "username": app.globalData.userInfo.username,
    }
    wx.request({
      url: app.globalData.serverAddress + '/activity/api/area/process/getRunningInstances',
      data: requestData,
      method: 'POST',
      header: {
        'content-type': 'application/json',
        "Authorization": "Bearer " + app.globalData.userInfo.access_token
      },
      success: function (res) {
        console.log(res)
        if (res.data.status == 0) {
          that.setData({
            processInstances: res.data.processInstances,
            loadingCompleted: true,
            messageTitle: "暂无正在运行的项目实例"
          })
          //页面加载完毕
          wx.hideLoading()
        }
        else if (res.statusCode == 401) { //token无效则返回登录页面
          delete app.globalData.userInfo
          wx.removeStorageSync('userInfo')

          that.setData({
            loadingCompleted: true,
            username: null,
            messageTitle: "操作失败",
            messageDetails: "登录信息已失效"
          })
          //页面加载完毕
          wx.hideLoading()
          setTimeout(function () {
            //返回登录页面
            wx.redirectTo({
              url: "../login/login"
            })
          }, 1500)
        }
        else {
          that.setData({
            loadingCompleted: true,
            messageTitle: "暂无正在运行的项目实例",
            messageDetails: res.data.message
          })
          //页面加载完毕
          wx.hideLoading()
        }
      },
      fail: function (res) {
        that.setData({
          loadingCompleted: true,
          messageTitle: "操作失败",
          messageDetails: res.errMsg
        })
        //页面加载完毕
        wx.hideLoading()
      }
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.onShow()
    wx.stopPullDownRefresh()
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})