// pages/activatableprocesses/Activatableprocesses.js
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    username: null,     //用户账号
    activatableProcesses: null, //用户可启动的流程

    loadingCompleted: false     //页面加载完成
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    //页面加载中
    wx.showLoading({
      title: ''
    })
    //获取页面参数和全局变量
    this.setData({
      username: app.globalData.userInfo.username
    })

    //请求获取用户有权限启动的流程
    var that = this
    wx.request({
      url: app.globalData.serverAddress + '/api/process/getBootableProcesses',
      data: {
        "username": that.data.username
      },
      method: 'POST',
      header: {
        'content-type': 'application/json',
      },
      success: function(res){
        if(res.data.status == 0){
          that.setData({
            activatableProcesses: res.data.processes
          })
        }
        else {
          wx.showToast({
            title: res.data.message,
            icon: 'none'
          })
        }
      },
      fail: function (res) {
        if (app.globalData.useFakeData){
          //假数据
          that.setData({
            activatableProcesses: [{
              "processId": "1",
              "processName": "海底捞餐饮店一"
            },
            {
              "processId": "7",
              "processName": "饿了么餐饮店七"
            },
            {
              "processId": "8",
              "processName": "美团餐饮八"
            }]
          })
        }
        else{
          wx.showToast({
            title: '错误:' + res.errMsg,
            icon: 'none'
          })
        }
      },
      complete: function (res) {
        //页面加载完毕
        that.setData({ loadingCompleted: true })
        wx.hideLoading()
      }
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