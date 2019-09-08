// pages/outwarehouseapplication/outwarehouseapplication.js
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,
    navbarIndex: 0, //顶部导航栏序号

    processInstances: {      //项目实例
      processInstanceId: [],   //项目实例ID
      processInstanceName:[]   //项目实例名称
    },
    cargoList: {              //货物类型列表
      id: [],   //货物类型ID
      name: [], //货物类型名称
    },

    outWareHouseRecords: [],  //填写出库记录列表
                              //{
                              //   "pickerIndex": 0,      //货物类型下拉框中的索引值
                              //   "num": 0,              //数量
                              //   "illegalError": false  //输入是否非法(数量为空)
                              //}
    processInstancePickerIndex: 0,    //选择出库的项目(下拉框索引值)
    outRemarks: {    //出库记录备注信息
      "content": "",    //备注内容
      "count": 0,       //统计字数
    },
    inWareHouseRecords: [],  //填写退库记录列表
                              //{
                              //   "pickerIndex": 0,      //货物类型下拉框中的索引值
                              //   "num": 0,              //数量
                              //   "illegalError": false  //输入是否非法(数量为空)
                              //}
    inRemarks: {    //退库记录备注信息
      "content": "",    //备注内容
      "count": 0,       //统计字数
    },

    hasSubmitted: false,      //是否已经提交，防止重复提交
    loadingCompleted: false,  //页面加载完成
    loadingCargoError: false, //读取货物类型列表错误
    loadingProcessInstancesError: false,  //读取项目实例信息错误
    notInstallerOrWarehouseman: false,    //非安装员或库管员
  },

  //返回上一级页面
  backToLastPage: function () {
    wx.navigateBack({
      delta: 1
    })
  },
  //注销账号
  logout: function (obj) {
    delete app.globalData.userInfo
    wx.removeStorageSync('userInfo')

    wx.redirectTo({
      url: '../login/login',
    })
  },

  //顶部导航栏切换事件
  navtabClick: function (obj) {
    this.setData({
      navbarIndex: obj.currentTarget.id
    });
  },

  //备注信息输入事件
  bindTextAreaInput: function(obj) {
    //统计字数
    var count = obj.detail.cursor
    //是否超出限制
    if (count <= 200) {
      if (this.data.navbarIndex == 0){  //出库备注
        this.setData({
          "outRemarks.content": obj.detail.value,
          "outRemarks.count": count
        })
      } else{ //退库备注
        this.setData({
          "inRemarks.content": obj.detail.value,
          "inRemarks.count": count
        })
      }
    }
  },
  //项目实例选择事件
  bindProcessInstancePickerChange: function(obj){
    this.setData({
      processInstancePickerIndex: obj.detail.value
    })
  },
  //货物数量输入事件
  bindTextBoxInput: function(obj) {
    var recordIndex = obj.currentTarget.dataset.index  //记录项序号

    var key
    if (this.data.navbarIndex == 0) {  //出库
      key = "outWareHouseRecords[" + recordIndex + "].num"
    } else {  //入库
      key = "inWareHouseRecords[" + recordIndex + "].num"
    }
    this.setData({
      [key]: obj.detail.value
    })

    //取消报错信息
    if (this.data.navbarIndex == 0) {  //出库
      if (this.data.outWareHouseRecords[recordIndex].illegalError == true){
        var illegalKey = "outWareHouseRecords[" + recordIndex + "].illegalError"

        this.setData({
          [illegalKey]: false
        })
      }
    } else{ //退库
      if (this.data.inWareHouseRecords[recordIndex].illegalError == true) {
        var illegalKey = "inWareHouseRecords[" + recordIndex + "].illegalError"

        this.setData({
          [illegalKey]: false
        })
      }
    }
  },
  //货物类型下拉框选择事件
  bindCargoPickerChange: function (obj) {
    var recordIndex = obj.currentTarget.dataset.index  //记录项序号

    var key
    if (this.data.navbarIndex == 0){  //出库
      key = "outWareHouseRecords[" + recordIndex + "].pickerIndex"
    } else {  //入库
      key = "inWareHouseRecords[" + recordIndex + "].pickerIndex"
    }
    
    this.setData({
      [key]: obj.detail.value
    })
  },

  //删除出库记录
  deleteRecord: function(obj) {
    var recordIndex = obj.currentTarget.dataset.index  //记录项序号

    if (this.data.navbarIndex == 0){  //出库
      this.data.outWareHouseRecords.splice(recordIndex, 1)
      this.setData({
        outWareHouseRecords: this.data.outWareHouseRecords
      })
    } else{ //入库
      this.data.inWareHouseRecords.splice(recordIndex, 1)
      this.setData({
        inWareHouseRecords: this.data.inWareHouseRecords
      })
    }
  },
  //添加出库记录
  addRecord: function() {
    if (this.data.navbarIndex == 0){  //出库
      this.setData({
        outWareHouseRecords: this.data.outWareHouseRecords.concat([{
          "pickerIndex": 0,
          "num": null,
          "illegalError": false
        }])
      })
    } else{ //入库
      this.setData({
        inWareHouseRecords: this.data.inWareHouseRecords.concat([{
          "pickerIndex": 0,
          "num": null,
          "illegalError": false
        }])
      })
    }
  },

  //提交出库、退库记录
  submitWarehouseRecords: function (obj) {
    //完整性检查
    if (this.data.navbarIndex == 0){ //出库申请检查
      if (this.data.outWareHouseRecords.length == 0) {   //记录条数是否为0
        wx.showToast({
          title: "请填写至少一条出库记录!",
          icon: "none"
        })

        return
      }
      for (var recordIndex in this.data.outWareHouseRecords) {
        if (this.data.outWareHouseRecords[recordIndex].num == null || this.data.outWareHouseRecords[recordIndex].num.length == 0) {  //是否为空
          wx.showToast({
            title: "出库数量未填写!",
            icon: "none"
          })
          var key = "outWareHouseRecords[" + recordIndex + "].illegalError"
          this.setData({
            [key]: true
          })

          return
        }
        else if (!/^[1-9][0-9]*$/.test(this.data.outWareHouseRecords[recordIndex].num)) {  /*是否非数字*/
          wx.showToast({
            title: "请填写非零开头的数字!",
            icon: "none"
          })
          var key = "outWareHouseRecords[" + recordIndex + "].illegalError"
          this.setData({
            [key]: true
          })

          return
        }
      }
    } else{ //退库申请检查
      if (this.data.inWareHouseRecords.length == 0) {   //记录条数是否为0
        wx.showToast({
          title: "请填写至少一条退库记录!",
          icon: "none"
        })

        return
      }
      for (var recordIndex in this.data.inWareHouseRecords) {
        if (this.data.inWareHouseRecords[recordIndex].num == null || this.data.inWareHouseRecords[recordIndex].num.length == 0) {  //是否为空
          wx.showToast({
            title: "退库数量未填写!",
            icon: "none"
          })
          var key = "inWareHouseRecords[" + recordIndex + "].illegalError"
          this.setData({
            [key]: true
          })

          return
        }
        else if (!/^[1-9][0-9]*$/.test(this.data.inWareHouseRecords[recordIndex].num)) {  /*是否非数字*/
          wx.showToast({
            title: "请填写非零开头的数字!",
            icon: "none"
          })
          var key = "inWareHouseRecords[" + recordIndex + "].illegalError"
          this.setData({
            [key]: true
          })

          return
        }
      }
    }
    
    //提交中
    wx.showLoading({
      title: "提交中",
    })
    //防止重复提交
    this.setData({
      hasSubmitted: true
    })

    //转换提交数据格式
    var formattedRecords = []
    var originRecords //未整理的记录
    if (this.data.navbarIndex == 0){
      originRecords = this.data.outWareHouseRecords
    } else {
      originRecords = this.data.inWareHouseRecords
    }
    for (let record of originRecords){
      var isRepeatedRecord = false  //是否为重复货物类型的记录
      for (var formattedRecordsIndex in formattedRecords){ //重复货物类型的记录将原先记录信息的货物数量相加
        if (formattedRecords[formattedRecordsIndex].cargoId == this.data.cargoList.id[record.pickerIndex]){
          formattedRecords[formattedRecordsIndex].num += JSON.parse(record.num)

          isRepeatedRecord = true
          break
        }
      }
      //新的货物类型新增记录信息
      if (isRepeatedRecord == false){
        formattedRecords.push({
          "cargoId": this.data.cargoList.id[record.pickerIndex],
          "num": JSON.parse(record.num)
        })
      }
    }
    //区分出库和退库提交的数据和url
    var requestData, requestUrl
    if (this.data.navbarIndex == 0){  //出库
      requestUrl = app.globalData.serverAddress + "/activity/api/area/warehouse/buildBatchOutStockRecord"
      requestData = {
        "instanceId": this.data.processInstances.processInstanceId[this.data.processInstancePickerIndex],
        "records": formattedRecords,
        "comment": this.data.outRemarks.content
      }
    } else{ //退库
      requestUrl = app.globalData.serverAddress + "/activity/api/area/warehouse/buildBatchReturnStockRecord"
      requestData = {
        "records": formattedRecords,
        "comment": this.data.inRemarks.content
      }
    }
    console.log(requestData, requestUrl)

    //向后台请求提交出库记录
    var that = this
    wx.request({
      url: requestUrl,
      data: requestData,
      method: 'POST',
      header: {
        'content-type': 'application/json',
        "Authorization": "Bearer " + app.globalData.userInfo.access_token
      },
      success: function (res) {
        if (res.data.status == 0) { //表单文本数据提交成功
          wx.showToast({
            title: '提交成功！'
          })
          //提交成功刷新页面
          if (that.data.navbarIndex == 0){  //清空出库数据
            that.setData({
              outWareHouseRecords: [],
              processInstancePickerIndex: 0,
              outRemarks: {
                "content": "",
                "count": 0,
              },
              hasSubmitted: false
            })
          } else { //清空退库数据
            that.setData({
              inWareHouseRecords: [],
              processInstancePickerIndex: 0,
              inRemarks: {
                "content": "",
                "count": 0,
              },
              hasSubmitted: false
            })
          }
          // //提交成功则退出页面
          // setTimeout(function () {
          //   wx.navigateBack({
          //     delta: 1
          //   })
          // }, 1500)
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
      fail: function (res) {
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

  //读取所有正在运行的项目实例
  requestGetRunningInstances: function() {
    var that = this
    var requestData = {
      "username": app.globalData.userInfo.username,
    }
    wx.request({
      url: app.globalData.serverAddress + '/activity/api/area/process/getRunningInstances',
      data: requestData,
      method: 'POST',
      header: {
        'content-type': 'application/json',
        "Authorization": "Bearer " + app.globalData.userInfo.access_token
      },
      success: function (res) {
        console.log(res)
        if (res.data.status == 0) {
          for (let processInstance of res.data.processInstances) {  //转换项目实例数据格式
            that.data.processInstances.processInstanceId.push(processInstance.processInstanceId)
            that.data.processInstances.processInstanceName.push(processInstance.processInstanceName)
          }

          that.setData({
            processInstances: that.data.processInstances,
            loadingCompleted: true,
            loadingProcessInstancesError: false
          })
          if (res.data.processInstances.length == 0){
            that.setData({
              loadingProcessInstancesError: true,
              messageTitle: "暂无正在运行的项目实例可供出库"
            })
          }

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
            messageTitle: "无正在运行的项目实例可供出库",
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
  //读取所有货物类型列表
  requeseGetCargoList: function() {
    var that = this
    wx.request({
      url: app.globalData.serverAddress + "/activity/api/warehouse/getAllCargoList",
      data: {
        "username": app.globalData.userInfo.username
      },
      method: 'POST',
      header: {
        'content-type': 'application/json',
        "Authorization": "Bearer " + app.globalData.userInfo.access_token
      },
      success: function (res) {
        console.log(res)
        if (res.data.status == 0) {
          for (let cargo of res.data.cargoList) {  //转换货物类型数据格式
            that.data.cargoList.id.push(cargo.id)
            that.data.cargoList.name.push(cargo.name)
          }
          that.setData({
            cargoList: that.data.cargoList,
            optionaCargoList: JSON.parse(JSON.stringify(res.data.cargoList)),
            loadingCargoError: false
          })
          if (res.data.cargoList.length == 0){
            that.setData({
              loadingCargoError: true,
              messageTitle: "无货物类型信息"
            })
          }

          //获取所有可以申请出库的运行项目
          that.requestGetRunningInstances()
        }
        else if (res.statusCode == 401) { //token无效则返回登录页面
          delete app.globalData.userInfo
          wx.removeStorageSync('userInfo')

          that.setData({
            loadingCompleted: true,
            loadingCargoError: true,
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
            loadingCargoError: true,
            messageTitle: "无货物列表信息",
            messageDetails: res.data.message
          })
          //页面加载完毕
          wx.hideLoading()
        }
      },
      fail: function (res) {
        //页面加载完毕
        that.setData({
          loadingCompleted: true,
          loadingCargoError: true,
          messageTitle: "操作失败",
          messageDetails: res.errMsg
        })
        wx.hideLoading()
      }
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    //若未登录，重定向至登录页面
    if (app.globalData.userInfo == null || app.globalData.userInfo == '') {
      wx.redirectTo({
        url: '../login/login',
      })
      return
    }
    console.log(app.globalData.userInfo.rolesStr, this.data.notInstallerOrWarehouseman)
    if (!(app.globalData.userInfo.rolesStr.includes("安装员") || app.globalData.userInfo.rolesStr.includes("库管员"))) { //只允许安装员或库管员查看该页面
      this.setData({
        userInfo: app.globalData.userInfo,
        loadingCompleted: true,
        notInstallerOrWarehouseman: true
      })
      return
    } else {
      this.setData({
        notInstallerOrWarehouseman: false
      })
    }

    //读取全局变量
    this.setData({
      userInfo: app.globalData.userInfo
    })
    //页面加载中
    wx.showLoading({
      title: '加载中',
    })

    //读取所有货物类型列表
    this.requeseGetCargoList()
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
    this.onLoad()
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