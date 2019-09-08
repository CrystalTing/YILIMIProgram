// pages/index/index.js
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    illegalError: [false, false], //输入是否非法
    hasSubmitted: false, //是否已经提交,防止重复提交
    userInfoList:[],
    inputaccount:false,  //输入账户
    inputText:null,  //输入的账号
    inputPassward:null
  },

  cancelIllegalError: function(obj) { //重新输入时，取消表单报错信息
    var id = obj.currentTarget.id
    if (this.data.illegalError[id] == true) {
      var key = "illegalError[" + id + "]"
      this.setData({
        [key]: false
      })
    }

    this.setData({
      inputaccount:false
    })

  },

  //微信登录
  wechatLogin: function(event) {
    if (event.detail.userInfo) { //用户已授权
      //防止重复提交
      this.setData({
        hasSubmitted: true
      })
      //登录中
      wx.showLoading({
        title: "登录中",
      })
      //获取微信头像
      var avatarUrl = event.detail.userInfo.avatarUrl
      //使用微信登录
      var that = this
      wx.login({ //获取登录code以便获取用户的OpenId
        success: function(res) {
          if (res.code) {
            console.log(res)
            wx.request({
              url: app.globalData.serverAddress + '/us/api/weChatLogin',
              data: {
                "code": res.code,
              },
              method: 'POST',
              header: {
                'content-type': 'application/json',
              },
              success: function(res) {
                console.log(res)
                if (res.data.status == 0) { //身份验证正确
                  wx.showToast({
                    title: '登录成功',
                  })
                  //登录信息保存本地缓存
                  var userInfo = res.data.userInfo.user
                  userInfo['avatarUrl'] = avatarUrl
                  userInfo["access_token"] = res.data.userInfo.jwt.access_token
                  userInfo["bindWechat"] = true
                  userInfo["rolesStr"] = res.data.userInfo.user.roles.reduce((rolesStr, role) => {
                    return rolesStr + role.alias + ","
                  }, "").slice(0, -1)
                  if (userInfo["rolesStr"] == null || userInfo["rolesStr"].length == 0) {
                    userInfo["rolesStr"] = "无"
                  }
                  app.globalData.userInfo = JSON.parse(JSON.stringify(userInfo))
                  wx.setStorageSync('userInfo', userInfo)
                  console.log("现在的用户: "+app.globalData.userInfo);

                  //保存该登录的用户信息到数组中
                  app.globalData.userInfoList.append(app.globalData.userInfo);
                  console.log("列表用户: "+app.globalData.userInfoList)

                  setTimeout(function() {
                    //跳转至主页
                    wx.switchTab({
                      url: '../homepage/homepage'
                    })
                    // //登录成功后重置按钮
                    // that.setData({
                    //   hasSubmitted: false
                    // })
                  }, 1500)
                } else if (res.data.message == "用户不存在") { //未绑定微信
                  wx.hideLoading()
                  //若提交失败,允许再次提交
                  that.setData({
                    hasSubmitted: false
                  })
                  wx.navigateTo({
                    url: "../bindwechat/bindwechat?hasLoggedin=false&avatarUrl=" + avatarUrl
                  })
                } else {
                  if (res.data.message == null || res.data.message.length == 0) {
                    wx.showToast({
                      title: "无返回数据",
                      icon: 'none'
                    })
                  } else {
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
              fail: function(res) {
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
          } else { //未拿到登录凭证code
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
        fail: function(res) {
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

  //登录
  login: function(obj) {
    if (obj.detail.value['username'] == null || obj.detail.value['username'].length == 0) {
      this.setData({
        ["illegalError[0]"]: true
      })
      wx.showToast({
        title: '账号不能为空!',
        icon: 'none'
      })
      return
    }
    if (obj.detail.value['password'] == null || obj.detail.value['password'].length == 0) {
      this.setData({
        ["illegalError[1]"]: true
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
    //登录中
    wx.showLoading({
      title: "登录中",
    })

    //向后台请求登录
    var that = this
    console.log(obj)
    wx.request({
      url: app.globalData.serverAddress + '/us/api/login',
      data: obj.detail.value,
      method: 'POST',
      header: {
        'content-type': 'application/json',
      },
      success: function(res) {
        console.log(res)
        if (res.data.status == 0) { //身份验证正确
          wx.showToast({
            title: '登录成功',
          })
          //登录信息保存本地缓存
          var userInfo = res.data.userInfo.user
          userInfo['position'] = "打杂"
          userInfo['avatarUrl'] = '/images/avatar.png'
          userInfo["access_token"] = res.data.userInfo.jwt.access_token
          userInfo["bindWechat"] = res.data.isBind
          userInfo["rolesStr"] = res.data.userInfo.user.roles.reduce((rolesStr, role) => {
            return rolesStr + role.alias + ","
          }, "").slice(0, -1)
          if (userInfo["rolesStr"] == null || userInfo["rolesStr"].length == 0) {
            userInfo["rolesStr"] = "无"
          }
          app.globalData.userInfo = JSON.parse(JSON.stringify(userInfo))
          wx.setStorageSync('userInfo', userInfo)
          console.log(app.globalData.userInfo);

          var hassame = false
          //加入用户列表
          for (let user of app.globalData.userInfoList){
            console.log(user)
            console.log(userInfo)
            if(user.username == userInfo.username){
              hassame=true
              console.log("不加入")
            }
          }  //若已保存用户账户则不再次保存
          if(hassame==false){
            console.log("加入")
            app.globalData.userInfoList.push(app.globalData.userInfo);
            that.setData({
              userInfoList: app.globalData.userInfoList
            })
          }
          console.log(app.globalData.userInfoList)

          setTimeout(function() {
            //跳转至主页
            wx.switchTab({
              url: '../homepage/homepage'
            })
            // //登录成功后重置按钮
            // that.setData({
            //   hasSubmitted: false
            // })
          }, 1500)
        } else {
          if (res.data.message == null || res.data.message.length == 0) {
            wx.showToast({
              title: "无返回数据",
              icon: 'none'
            })
          } else {
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
      fail: function(res) {
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

  //历史用户的显示
  onputaccount:function(){
    this.setData({
      inputaccount:true
    })
  },

  //点击下拉框中的用户
  selectClick:function(event){
    this.setData({
      inputaccount: false
    })
    console.log(event)
    this.setData({
      inputText: event.currentTarget.dataset.set.username,
    })

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.setData({
      userInfoList:app.globalData.userInfoList
    })
    
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {
    wx.stopPullDownRefresh()
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})