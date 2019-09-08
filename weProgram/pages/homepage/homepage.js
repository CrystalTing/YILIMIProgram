//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    userInfo: null,             //用户信息

    processes: null,            //可参与的项目
    assignableProcesses: null,  //可分配任务的项目

    loadingCompleted: false,  //页面加载完成
  },

  //注销账号
  logout: function(obj){
    delete app.globalData.userInfo
    wx.removeStorageSync('userInfo')

    wx.redirectTo({
      url: '../login/login',
    })
  },

  onLoad: function () {
    //若未登录，重定向至登录页面
    if (app.globalData.userInfo == null || app.globalData.userInfo == '') {
      return
    }
  },

  onShow: function () {
    if (app.globalData.userInfo == null || app.globalData.userInfo == '') {
      wx.redirectTo({
        url: '../login/login',
      })
      return
    }
    console.log(app.globalData.userInfo)

    //页面加载中
    wx.showLoading({
      title: "加载中"
    })
    this.setData({
      userInfo: app.globalData.userInfo,
      processes: null,
      loadingCompleted: false,
    })

    //查找用户有权限参与的项目
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
            messageTitle: "暂无项目可参与"
          })
          //页面加载完毕
          wx.hideLoading()
        }
        else if (res.statusCode == 401){ //token无效则返回登录页面
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
            messageTitle: "暂无可参与的项目",
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

    //查找用户有权限分配任务的项目
    // wx.request({
    //   url: app.globalData.serverAddress + "/api/process/getAssignableProcess",
    //   data: requestData,
    //   method: 'POST',
    //   header: {
    //     'content-type': 'application/json',
    //   },
    //   success: function (res) {
    //     if (res.data.status == 0) {
    //       that.setData({
    //         assignableProcesses: res.data.processes
    //       })
    //     }
    //     else {
    //       wx.showToast({
    //         title: res.data.message,
    //         icon: 'none'
    //       })
    //     }
    //   },
    //   fail: function (res) {
    //     if (app.globalData.useFakeData) {
    //       //假数据
    //       that.setData({
    //         assignableProcesses: [{
    //           "processId": "4",
    //           "processName": "快餐项目四"
    //         },
    //         {
    //           "processId": "6",
    //           "processName": "火锅项目六"
    //         },
    //         {
    //           "processId": "8",
    //           "processName": "奶茶餐饮项目八"
    //         }]
    //       })
    //     }
    //     else {
    //       wx.showToast({
    //         title: '错误:' + res.errMsg,
    //         icon: 'none'
    //       })
    //     }
    //   },
    //   complete: function (res) {
    //     that.setData({ loadingCompleted: true })
    //     //页面加载完毕
    //     wx.hideLoading()
    //   }
    // })
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.onShow()
    wx.stopPullDownRefresh()
  },
})
