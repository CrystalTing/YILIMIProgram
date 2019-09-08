// pages/regist.js
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,
    areas: {            //可选择的所在区域列表
      index: 0,
      id: [],
      name: []
    },
    agents: {         //可选择的所属合伙人列表
      index: 0,
      id: [],
      name: []
    },

    illegalError: [false, false, false, false, false, false, false],  //输入是否合法
    hasSubmitted: false,   //是否已成功提交，防止重复提交

    loadingCompleted: false,  //页面加载完成
    loadingAreaError: false,  //读取区域列表信息是否出错
    loadingAgentError: false, //读取合伙人列表信息是否出错

    // users: ["GZcloud001  邓仁-洪丽-云端001  13650953964",
    //   "GZcloud002  蒯世-洪丽-云端002  13787479275", 
    //   "GZcloud003  戌苓-洪丽-云端003  13943112810",
    //   "WHcloud001  蒙佑-王朗-云端001  15200468979",
    //   "WHcloud002  郭怡-王朗-云端002  13749734584",
    //   "WHcloud003  李涛-王朗-云端003  18532973937",
    //   "SHcloud001  幸拯-柯西-云端001  13847745766",
    //   "SHcloud002  松豪-柯西-云端002  15550485142",
    //   "SHcloud003  易珹-柯西-云端003  18756414403"
    // ]
  },

  //返回上一级页面
  backToLastPage: function () {
    wx.navigateBack({
      delta: 1
    })
  },

  cancelIllegalError: function (obj) { //重新输入时，取消表单报错信息
    var id = obj.currentTarget.id
    if (this.data.illegalError[id] == true) {
      var key = "illegalError[" + id + "]"
      this.setData({
        [key]: false
      })
      if (id == 2 && this.data.illegalError[1] == true){
        this.setData({
          ["illegalError[1]"]: false
        })
      }
      else if (id == 1 && this.data.illegalError[2] == true){
        this.setData({
          ["illegalError[2]"]: false
        })
      }
    }
  },
  //选择所在区域
  bindAreaPickerChange: function (obj){
    var pickerIndex = JSON.parse(obj.detail.value)  //下拉框选择的序号

    this.setData({
      ["areas.index"]: pickerIndex
    })
  },
  //选择所属合伙人
  bindAgentPickerChange: function (obj) {
    var pickerIndex = JSON.parse(obj.detail.value)  //下拉框选择的序号

    this.setData({
      ["agents.index"]: pickerIndex
    })
  },

  //向后台发送注册数据
  requestRegist: function(requestData, requestUrl){
    console.log(requestData)
    var that = this
    wx.request({
      url: requestUrl,
      data: requestData,
      method: 'POST',
      success: function (res) {
        console.log(res.data)
        if (res.data.status == 0) {
          wx.showToast({
            title: "已提交审核"
          })
          setTimeout(function () {
            //返回上一级页面
            wx.navigateBack({
              delta: 1
            })
          }, 1500)
        }
        else {
          wx.showToast({
            title: res.data.message,
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
  //注册
  regist: function(obj){
    //检查是否为空
    var i = 0
    for(var key in obj.detail.value){
      if (key != "bindWechat" && (obj.detail.value[key].length == 0 || obj.detail.value[key] == null)){
        var k = "illegalError[" + i + "]"
        this.setData({
          [k]: true
        })
        wx.showToast({
          title: '请确认信息填写完整!',
          icon: 'none'
        })
        return
      }
      i++
    }
    //检查密码和确认密码是否一致
    if (obj.detail.value['password'] != obj.detail.value['confirmPassword']){
      this.setData({
        ["illegalError[1]"]: true,
        ["illegalError[2]"]: true
      })
      wx.showToast({
        title: '密码和确认密码不一致!',
        icon: 'none'
      })
      return
    }
    //检查非法输入值
    var usernameStr = /^[0-9a-zA-Z]{6,}$/; //账号格式
    if (!usernameStr.test(obj.detail.value['username'])){
      this.setData({
        ["illegalError[0]"]: true
      })
      wx.showToast({
        title: '账号只能由字母和数字组成，且长度必须不小于6位!',
        icon: 'none'
      })
      return
    }
    if (obj.detail.value['password'].length < 6) { //检查密码长度是否符合要求
      this.setData({
        ["illegalError[1]"]: true
      })
      wx.showToast({
        title: '密码长度必须不小于6位!',
        icon: 'none'
      })
      return
    }
    if (!/^[1-9][0-9]{10}$/.test(obj.detail.value['phoneNumber'])){ //检查电话号码输入
      this.setData({
        ["illegalError[4]"]: true
      })
      wx.showToast({
        title: '电话号码必须是11位数字!',
        icon: 'none'
      })
      return
    }
    //提交中
    wx.showLoading({
      title: "提交中",
    })
    //防止重复提交
    this.setData({
      hasSubmitted: true
    })
    //将下拉选择框的索引换成值
    // obj.detail.value["areaId"] = this.data.areas.id[obj.detail.value["areaId"]]
    obj.detail.value["agentId"] = this.data.agents.id[obj.detail.value["agentId"]]

    var that = this
    //绑定微信
    if (obj.detail.value["bindWechat"] != null && obj.detail.value["bindWechat"].length > 0){
      wx.login({  //获取登录code以便获取用户的OpenId
        success: function (res){
          if(res.code){
            //绑定微信注册
            delete obj.detail.value["bindWechat"]
            obj.detail.value["code"] = res.code
            that.requestRegist(obj.detail.value, app.globalData.serverAddress + '/us/api/weChatRegistry')
          }
          else{
            wx.showToast({
              title: "错误:" + res.errMsg,
              icon: 'none'
            })
            //若提交失败，允许再次提交
            that.setData({
              hasSubmitted: false
            })
          }
        },
        fail: function(res){
          wx.showToast({
            title: res.errMsg,
            icon: 'none'
          })
          //若提交失败，允许再次提交
          that.setData({
            hasSubmitted: false
          })
        }
      })
    }
    else{ //不绑定微信
      //发送数据
      this.requestRegist(obj.detail.value, app.globalData.serverAddress + '/us/api/registry')
    }

    // for(var i = 0; i < 9; i++){
    //   var userInfo = this.data.users[i].split("  ")
    //   var requestData = {
    //     "username": userInfo[0],
    //     "password": "123456",
    //     "confirmPassword": "123456",
    //     "alias": userInfo[1],
    //     "phoneNumber": userInfo[2]
    //   }
    //   if(i < 3){
    //     requestData["agentId"] = "2c9180886c8f2ac7016c92cdd46d0009"
    //   }
    //   else if(i >= 3 && i < 6){
    //     requestData["agentId"] = "2c9180886c8f2ac7016c92ce423b000b"
    //   }
    //   else{
    //     requestData["agentId"] = "2c9180886c8f2ac7016c92cea5e5000d"
    //   }
    //   // console.log(requestData)

    //   this.requestRegist(requestData, app.globalData.serverAddress + '/us/api/registry')
    // }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    //页面加载中
    wx.showLoading({
      title: "加载中",
    })

    var that = this
    wx.request({
      url: app.globalData.serverAddress + "/us/api/area/getAgentList",
      data: {},
      method: "POST",
      success: function (res) {
        console.log(res)
        if (res.data.status == 0) {  //请求数据成功
          for (let agent of res.data.list) {  //格式化合伙人列表数据
            that.data.agents.id.push(agent.id)
            that.data.agents.name.push(agent.name)
          }
          that.setData({
            agents: that.data.agents,
            loadingCompleted: true,
            loadingAgentError: false
          })

          //页面加载完毕
          wx.hideLoading()
        }
        else {
          that.setData({
            loadingCompleted: true,
            loadingAgentError: true,
            messageTitle: "读取区域列表信息错误",
            messageDetails: res.data.message
          })
          //页面加载完毕
          wx.hideLoading()
        }
      },
      fail: function (res) {
        that.setData({
          loadingCompleted: true,
          loadingAgentError: true,
          messageTitle: "读取区域列表信息错误",
          messageDetails: res.errMsg
        })
        //页面加载完毕
        wx.hideLoading()
      }
    })
    // wx.request({
    //   url: app.globalData.serverAddress + "/activity/api/area/getNotStopAreaList",
    //   data: {},
    //   method: "POST",
    //   success: function (res) {
    //     console.log(res)
    //     if (res.data.status == 0){  //请求数据成功
    //       for (let area of res.data.areaList){  //格式化区域列表数据
    //         that.data.areas.id.push(area.id)
    //         that.data.areas.name.push(area.name)
    //       }
    //       that.setData({
    //         areas: that.data.areas,
    //         loadingCompleted: true,
    //         loadingAreaError: false
    //       })

    //       //页面加载完毕
    //       wx.hideLoading()
    //     }
    //     else{
    //       that.setData({
    //         loadingCompleted: true,
    //         loadingAreaError: true,
    //         messageTitle: "读取区域列表信息错误",
    //         messageDetails: res.data.message
    //       })
    //       //页面加载完毕
    //       wx.hideLoading()
    //     }
    //   },
    //   fail: function (res){
    //     that.setData({
    //       loadingCompleted: true,
    //       loadingAreaError: true,
    //       messageTitle: "读取区域列表信息错误",
    //       messageDetails: res.errMsg
    //     })
    //     //页面加载完毕
    //     wx.hideLoading()
    //   }
    // })
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