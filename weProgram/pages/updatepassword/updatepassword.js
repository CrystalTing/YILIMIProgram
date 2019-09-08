// pages/updatepassword/updatepassword.js
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    username: null, //账号

    illegalError: [false, false, false, false],  //输入是否合法
    hasSubmitted: false   //是否已成功提交，防止重复提交
  },

  cancelIllegalError: function (obj) { //重新输入时，取消表单报错信息
    var id = obj.currentTarget.id
    if (this.data.illegalError[id] == true) {
      var key = "illegalError[" + id + "]"
      this.setData({
        [key]: false
      })
      if (id == 3 && this.data.illegalError[2] == true) {
        this.setData({
          ["illegalError[2]"]: false
        })
      }
      else if (id == 2 && this.data.illegalError[3] == true) {
        this.setData({
          ["illegalError[3]"]: false
        })
      }
    }
  },

  //修改密码
  updatePassword: function(obj){
    //合法性检验
    //检查是否为空
    var i = 0
    for (var key in obj.detail.value) {
      if (key != "bindWechat" && (obj.detail.value[key].length == 0 || obj.detail.value[key] == null)) {
        var k = "illegalError[" + i + "]"
        this.setData({
          [k]: true
        })
        wx.showToast({
          title: '请确认填写完整!',
          icon: 'none'
        })
        return
      }
      i++
    }
    //检查非法输入值
    var usernameStr = /^[0-9a-zA-Z]{5,}$/; //账号格式
    if (!usernameStr.test(obj.detail.value['username'])) {
      this.setData({
        ["illegalError[0]"]: true
      })
      wx.showToast({
        title: '账号只能由字母和数字组成，且长度必须不小于5位!',
        icon: 'none'
      })
      return
    }
    //检查新密码和确认密码是否一致
    if (obj.detail.value['password_new'] != obj.detail.value['confirmPassword']) {
      this.setData({
        ["illegalError[2]"]: true,
        ["illegalError[3]"]: true
      })
      wx.showToast({
        title: '密码和确认密码不一致!',
        icon: 'none'
      })
      return
    }
    //检查新密码是否不同于旧密码
    if (obj.detail.value['password_new'] == obj.detail.value['password']) {
      this.setData({
        ["illegalError[2]"]: true
      })
      wx.showToast({
        title: '新密码不能和旧密码一样!',
        icon: 'none'
      })
      return
    }
    if (obj.detail.value['password_new'].length < 5) { //检查密码长度是否符合要求
      this.setData({
        ["illegalError[2]"]: true
      })
      wx.showToast({
        title: '新密码长度必须不小于5位!',
        icon: 'none'
      })
      return
    }

    //防止多次提交
    this.setData({
      hasSubmitted: true
    })
    //提交中
    wx.showLoading({
      title: "提交中",
    })
    //请求修改密码
    var that = this
    wx.request({
      url: app.globalData.serverAddress + '/us/api/updatePassword',
      data: {
        "username": app.globalData.userInfo.username,
        "oldPassword": obj.detail.value["password"],
        "newPassword": obj.detail.value["password_new"],
        "confirmPassword": obj.detail.value["confirmPassword"]
      },
      method: 'POST',
      header: {
        'content-type': 'application/json',
        "Authorization": "Bearer " + app.globalData.userInfo.access_token
      },
      success: function (res) {
        console.log(res)
        if (res.data.status == 0){
          wx.showToast({
            title: "修改成功"
          })
          //强制重新登录
          delete app.globalData.userInfo
          wx.removeStorageSync('userInfo')
          setTimeout(function () {
            wx.redirectTo({
              url: "../login/login"
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
        else{
          wx.showToast({
            title: res.data.message,
            icon: 'none'
          })
          //若提交失败，允许再次提交
          that.setData({
            hasSubmitted: false
          })
        }
      },
      fail: function (res){
        wx.showToast({
          title: '错误:' + res.errMsg,
          icon: 'none'
        })
        //若提交失败，允许再次提交
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
    //获取页面参数和全局变量
    if (app.globalData.userInfo){
      this.setData({
        username: app.globalData.userInfo.username
      })
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