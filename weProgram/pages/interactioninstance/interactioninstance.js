// pages/interactiveinstance/interactiveinstance.js
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    username: null,           //用户账号
    processId: null,          //流程ID
    processName: null,        //流程名称
    processInstances: null,   //流程实例

    loadingCompleted: false,  //页面加载完毕
  },

  //返回上一级页面
  backToLastPage: function () {
    wx.navigateBack({
      delta: 1
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    //接收页面参数和全局变量
    this.setData({
      username: app.globalData.userInfo.username,
      processId: options.processId,
      processName: options.processName
    })
    //设置页面标题
    wx.setNavigationBarTitle({
      title: this.data.processName,
    })
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
    //页面加载中
    this.setData({
      processInstances: null,
      loadingCompleted: false
    })
    wx.showLoading({
      title: "加载中"
    })

    //请求获取该用户需要完成的流程实例
    var that = this
    var requestData = {
      "username": this.data.username,
      "processId": this.data.processId
    }
    wx.request({
      url: app.globalData.serverAddress + '/activity/api/interaction/getInvolvedProcessInstances',
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
            messageTitle: "暂无需要互动的项目"
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
            messageTitle: "暂无需要互动的项目",
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