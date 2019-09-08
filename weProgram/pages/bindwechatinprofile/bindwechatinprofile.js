// pages/bindwechatinprofile/bindwechatinprofile.js
const app =getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,         //用户信息

    password: {
      "value": null,        //值
      "illegalError": false //输入是否非法
    },
    hasSubmitted: false     //是否已经提交,防止重复提交
  },

  bindInput: function (obj) { //获取输入数据
    //重新输入时，取消表单报错信息
    if (this.data.password.illegalError == true) {
      this.setData({
        ["password.illegalError"]: false
      })
    }
    this.data.password.value = obj.detail.value
  },

  //绑定微信
  bindWechat: function(event){
    if (event.detail.userInfo){   //用户已授权
      //完整性验证
      if (this.data.password.value == null || this.data.password.value.length == 0) {
        this.setData({
          ["password.illegalError"]: true
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

      //绑定中
      wx.showLoading({
        title: "绑定中",
      })
      //获取微信头像
      var avatarUrl = event.detail.userInfo.avatarUrl
      //向后台请求绑定微信
      var that = this
      wx.login({  //获取登录code以便获取用户的OpenId
        success: function (res) {
          if (res.code) {
            console.log(res)
            //绑定微信
            wx.request({
              url: app.globalData.serverAddress + '/us/api/weChatBind',
              data: {
                "code": res.code,
                "username": app.globalData.userInfo.username,
                "password": that.data.password.value
              },
              method: 'POST',
              header: {
                'content-type': 'application/json',
              },
              success: function (res) {
                console.log(res)
                if (res.data.status == 0) {  //身份验证正确
                  wx.showToast({
                    title: '绑定成功',
                  })
                  //重新设置头像信息
                  app.globalData.userInfo["avatarUrl"] = avatarUrl
                  app.globalData.userInfo["bindWechat"] = true
                  wx.setStorageSync('userInfo', app.globalData.userInfo)

                  setTimeout(function () {
                    //返回上一页面
                    wx.navigateBack({
                      delta: 1
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
          }
          else { //未拿到登录凭证code
            wx.showToast({
              title: "错误" + res.errMsg,
              icon: 'none'
            })
            //若提交失败,允许再次提交
            that.setData({
              hasSubmitted: false
            })
          }
        },
        fail: function (res) {
          wx.showToast({
            title: res.errMsg,
            icon: 'none'
          })
          //若提交失败,允许再次提交
          that.setData({
            hasSubmitted: false
          })
        }
      })
    }
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