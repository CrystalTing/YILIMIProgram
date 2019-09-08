// pages/Profile/Profile.js
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,

    loadingCompleted: false,  //页面加载完成
    hasLoggedout: false,      //防止重复点击退出登录
  },
  previewAvatar: function(obj){ //预览头像大图
    wx.previewImage({
      current: obj.currentTarget.id, // 当前显示图片的http链接
      urls: [obj.currentTarget.id]   // 需要预览的全部图片http链接列表
    })
  },

  //注销账号
  logout: function (obj) {
    //防止重复点击注销
    this.setData({
      hasLoggedout: true
    })
    //后台注销
    var that = this
    wx.request({
      url: app.globalData.serverAddress + '/us/api/logout',
      data: {
        "username": app.globalData.userInfo.username
      },
      method: 'POST',
      header: {
        'content-type': 'application/json',
        "Authorization": "Bearer " + app.globalData.userInfo.access_token
      },
      success: function (res){
        console.log(res)
        if (res.data.status == 0 || res.statusCode == 401){
          //清除登录信息
          delete app.globalData.userInfo
          wx.removeStorageSync('userInfo')
          console.log(app.globalData.userInfo)

          //返回登录页面
          wx.redirectTo({
            url: '../login/login',
          })
        }
        else {
          wx.showToast({
            title: res.data.message,
            icon: 'none'
          })
          //若提交失败，允许再次点击
          that.setData({
            hasLoggedout: false
          })
        }
      },
      fail: function (res){
        wx.showToast({
          title: '错误:' + res.errMsg,
          icon: 'none'
        })
        //若提交失败，允许再次点击
        that.setData({
          hasLoggedout: false
        })
      }
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
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
    this.setData({
      userInfo: app.globalData.userInfo
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