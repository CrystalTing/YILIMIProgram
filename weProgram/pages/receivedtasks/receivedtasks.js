// pages/receivedtasks/receivedtasks.js
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    username: null,

    processInstanceId: null,    //项目实例ID
    processInstanceName: null,  //项目实例名称
    tasks: null,     //可接收的任务

    loadingCompleted: false,  //页面加载完成
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
      processInstanceId: options.processInstanceId,
      processInstanceName: options.processInstanceName
    })
    console.log(this.data)
    //设置页面标题
    wx.setNavigationBarTitle({
      title: this.data.processInstanceName,
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
    wx.showLoading({
      title: "加载中"
    })
    this.setData({
      tasks: null,
      loadingCompleted: false,
    })

    //请求获取所有正在运行中的流程实例
    var that = this
    var requestData = {
      "processInstanceId": that.data.processInstanceId,
    }
    wx.request({
      url: app.globalData.serverAddress + '/activity/api/area/taskReceiver/getReceiverTasks',
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
            tasks: res.data.tasks,
            loadingCompleted: true,
            messageTitle: "暂无可接收的任务表单"
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
            messageTitle: "无可接收的任务表单",
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