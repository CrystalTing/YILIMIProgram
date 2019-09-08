// pages/interactivefeedback/interactive.js
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,             //用户信息

    processes: null,            //可进行互动的项目

    loadingCompleted: false,  //页面加载完成
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
    if (app.globalData.userInfo == null || app.globalData.userInfo == '') { //若未登录，重定向至登录页面
      wx.redirectTo({
        url: '../login/login',
      })
      return
    }
    if (!app.globalData.userInfo.rolesStr.includes("售后")){ //只允许售后人员查看该页面
      this.setData({
        userInfo: app.globalData.userInfo,
        loadingCompleted: true,
        notUpper: true
      })
      return
    } else {
      this.setData({
        notUpper: false
      })
    }
    //页面加载中
    wx.showLoading({
      title: "加载中"
    })
    this.setData({
      userInfo: app.globalData.userInfo,
      processes: null,
      loadingCompleted: false,
      notUpper: false
    })

    //查找用户有权限与商家互动的项目
    var that = this
    var requestData = {
      'username': this.data.userInfo['username']
    }
    wx.request({
      url: app.globalData.serverAddress + '/activity/api/process/getProcesses',
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
            processes: res.data.processes,
            loadingCompleted: true,
            messageTitle: "暂无项目需要互动"
          })
          //页面加载完毕
          wx.hideLoading()
        }
        else if (res.statusCode == 401) { //token无效则返回登录页面
          delete app.globalData.userInfo
          wx.removeStorageSync('userInfo')

          that.setData({
            loadingCompleted: true,
            userInfo: null,
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
            messageTitle: "暂无项目需要互动",
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