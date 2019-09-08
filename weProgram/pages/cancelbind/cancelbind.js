// pages/cancelbind/cancelbind.js
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,         //用户信息

    illegalError: false,    //输入是否非法
    hasSubmitted: false     //是否已经提交,防止重复提交
  },

  cancelIllegalError: function (obj) { //重新输入时，取消表单报错信息
    if (this.data.illegalError == true) {
      this.setData({
        illegalError: false
      })
    }
  },

  //解绑微信
  cancelBindWechat: function(obj){
    //完整性验证
    if (obj.detail.value['password'] == null || obj.detail.value['password'].length == 0) {
      this.setData({
        illegalError: true
      })
      wx.showToast({
        title: '密码不能为空!',
        icon: 'none'
      })
      return
    }
    //防止重复提交
    this.setData({
      hasSubmitted: true
    })
    wx.showLoading({
      title: "解绑中",
    })

    //向后台请求解绑
    var that = this
    wx.request({
      url: app.globalData.serverAddress + '/us/api/weChatUnbind',
      data: {
        "username": app.globalData.userInfo.username,
        "password": obj.detail.value["password"]
      },
      method: 'POST',
      header: {
        'content-type': 'application/json',
        "Authorization": "Bearer " + app.globalData.userInfo.access_token
      },
      success: function (res) {
        console.log(res)
        if (res.data.status == 0) {  //身份验证正确
          wx.showToast({
            title: '解绑成功',
          })
          //重新设置头像信息
          app.globalData.userInfo["avatarUrl"] = "/images/avatar.png"
          app.globalData.userInfo["bindWechat"] = false
          wx.setStorageSync('userInfo', app.globalData.userInfo)

          setTimeout(function () {
            //返回上一页面
            wx.navigateBack({
              delta: 1
            })
          }, 1500)
        }
        else if (res.statusCode == 401) { //token无效则返回登录页面
          delete app.globalData.userInfo
          wx.removeStorageSync('userInfo')

          wx.showToast({
            title: "登录信息已失效",
            icon: 'none'
          })
          setTimeout(function () {
            //返回登录页面
            wx.redirectTo({
              url: "../login/login"
            })
          }, 1500)
        }
        else {
          if (res.data.message == null || res.data.message.length == 0) {
            wx.showToast({
              title: "无返回数据",
              icon: 'none'
            })
          }
          else {
            wx.showToast({
              title: res.data.message,
              icon: 'none'
            })
          }
          //若提交失败,允许再次提交
          that.setData({
            hasSubmitted: false
          })
        }
      },
      fail: function (res) {
        wx.showToast({
          title: '错误:' + res.errMsg,
          icon: 'none'
        })
        //若提交失败,允许再次提交
        that.setData({
          hasSubmitted: false
        })
      }
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      userInfo: app.globalData.userInfo
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