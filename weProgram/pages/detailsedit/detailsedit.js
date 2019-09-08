// pages/DetailsEdit/DetailsEdit.js
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    formId: null,     //修改信息项ID
    formTitle: null,  //修改信息项名称
    content: "",      //原内容

    areas: {          //可选择的所在区域列表
      index: 0,
      id: [],
      name: []
    },
    agents: {         //可选择的所属合伙人列表
      index: 0,
      id: [],
      name: []
    },

    hasSubmitted: false,      //是否已成功提交表单，防止重复提交
    loadingCompleted: false,  //页面加载完成
    loadingAreaError: false,  //读取区域列表信息是否出错
    loadingAgentError: false, //读取合伙人列表信息是否出错
  },

  //选择所在区域
  bindAreaPickerChange: function (obj) {
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

  //修改用户信息
  updateUserInfo: function (obj){
    //合法性验证
    if (this.data.formId != "area" && this.data.formId != "agent"){
      if (obj.detail.value[this.data.formId] == null || obj.detail.value[this.data.formId].length == 0){  //填写完整
        wx.showToast({
          title: "信息未填写!",
          icon: "none"
        })
        return
      }
      if (this.data.formId == "phoneNumber"){
        if (!/^[1-9][0-9]{10}$/.test(obj.detail.value[this.data.formId])){
          wx.showToast({
            title: "电话号码只能输入非0开头的11位数字!",
            icon: "none"
          })
          return
        }
      }
    }
    //防止重复提交
    this.setData({
      hasSubmitted: true
    })
    //提交中
    wx.showLoading({
      title: "提交中",
    })
    
    var requestData = {
      "username": JSON.parse(JSON.stringify(app.globalData.userInfo.username)),
      "alias": JSON.parse(JSON.stringify(app.globalData.userInfo.alias)),
      "phoneNumber": JSON.parse(JSON.stringify(app.globalData.userInfo.phoneNumber)),
      "agentId": JSON.parse(JSON.stringify(app.globalData.userInfo.agent.id))
      // "areaId": JSON.parse(JSON.stringify(app.globalData.userInfo.area.id))
    }
    if (this.data.formId == "area"){  //若是所在区域，需要把输入框value从下标转换为值
      requestData["areaId"] = this.data.areas.id[this.data.areas.index]
    }
    else if (this.data.formId == "agent") {  //若是所属合伙人，需要把输入框value从下标转换为值
      requestData["agentId"] = this.data.agents.id[this.data.agents.index]
    }
    else{
      requestData[this.data.formId] = obj.detail.value[this.data.formId]
    }

    var that = this
    //请求修改个人信息
    wx.request({
      url: app.globalData.serverAddress + "/us/api/updateUserInfo",
      data: requestData,
      method: 'POST',
      header: {
        'content-type': 'application/json',
        "Authorization": "Bearer " + app.globalData.userInfo.access_token
      },
      success: function (res){
        console.log(res)
        if (res.data.status == 0){
          //保存更新后的数据
          if (that.data.formId == "area"){
            app.globalData.userInfo.area.id = that.data.areas.id[that.data.areas.index]
            app.globalData.userInfo.area.name = that.data.areas.name[that.data.areas.index]
          }
          else if (that.data.formId == "agent"){
            app.globalData.userInfo.agent.id = that.data.agents.id[that.data.agents.index]
            app.globalData.userInfo.agent.name = that.data.agents.name[that.data.agents.index]
          }
          else{
            app.globalData.userInfo[that.data.formId] = obj.detail.value[that.data.formId]
          }
          wx.setStorageSync("userInfo", app.globalData.userInfo)

          wx.showToast({
            title: "修改成功",
          })
          setTimeout(function () {
            //返回上一级页面
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
    //获取页面参数
    this.setData({
      formId: options.formId,
      formTitle: options.formTitle,
      content: options.content
    })
    // 设置标题
    wx.setNavigationBarTitle({
      title: options.formTitle
    })

    //若修改所在区域信息，需要请求获取所有可选区域列表
    if (this.data.formId == "area"){
      //页面加载中
      wx.showLoading({
        title: "加载中",
      })

      var that = this
      wx.request({
        url: app.globalData.serverAddress + "/activity/api/area/getNotStopAreaList",
        data: {},
        method: "POST",
        success: function (res) {
          console.log(res)
          if (res.data.status == 0) {  //请求数据成功
            for (var index in res.data.areaList) {  //格式化区域列表数据
              that.data.areas.id.push(res.data.areaList[index].id)
              that.data.areas.name.push(res.data.areaList[index].name)
              if (res.data.areaList[index].name == that.data.content){  //设置区域下拉框初始索引值
                that.data.areas.index = index
              }
            }
            that.setData({
              areas: that.data.areas,
              loadingCompleted: true,
              loadingAreaError: false
            })

            //页面加载完毕
            wx.hideLoading()
          }
          else {
            that.setData({
              loadingCompleted: true,
              loadingAreaError: true,
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
            loadingAreaError: true,
            messageTitle: "读取区域列表信息错误",
            messageDetails: res.errMsg
          })
          //页面加载完毕
          wx.hideLoading()
        }
      })
    }
    //若修改所属合伙人信息，需要请求获取所有可选区域列表
    else if (this.data.formId == "agent"){
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
            for (var index in res.data.list) {  //格式化合伙人列表数据
              that.data.agents.id.push(res.data.list[index].id)
              that.data.agents.name.push(res.data.list[index].name)
              if (res.data.list[index].name == that.data.content) {  //设置合伙人下拉框初始索引值
                that.data.agents.index = index
              }
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
              messageTitle: "读取合伙人列表信息错误",
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
            messageTitle: "读取合伙人列表信息错误",
            messageDetails: res.errMsg
          })
          //页面加载完毕
          wx.hideLoading()
        }
      })
    }
    else{
      this.setData({
        loadingCompleted: true
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