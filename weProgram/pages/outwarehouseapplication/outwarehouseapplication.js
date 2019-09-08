// pages/outwarehouseapplication/outwarehouseapplication.js
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    processInstanceId: null,  //流程实例Id
    processInstanceName: null,//流程实例名称

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
    remarks: {    //备注信息
      "content": "",    //备注内容
      "count": 0,       //统计字数
    },

    hasSubmitted: false,      //是否已经提交，防止重复提交
    loadingCompleted: false,  //页面加载完成
    loadingCargoError: false, //读取货物类型列表错误
  },

  //返回上一级页面
  backToLastPage: function () {
    wx.navigateBack({
      delta: 1
    })
  },

  //备注信息输入事件
  bindTextAreaInput: function(obj) {
    //统计字数
    var count = obj.detail.cursor
    //是否超出限制
    if (count <= 200) {
      this.setData({
        "remarks.content": obj.detail.value,
        "remarks.count": count
      })
    }
  },
  //货物数量输入事件
  bindTextBoxInput: function(obj) {
    var recordIndex = obj.currentTarget.dataset.index  //记录项序号

    console.log(obj)
    var key = "outWareHouseRecords[" + recordIndex + "].num"
    this.setData({
      [key]: obj.detail.value
    })

    //取消报错信息
    if (this.data.outWareHouseRecords[recordIndex].illegalError == true){
      var illegalKey = "outWareHouseRecords[" + recordIndex + "].illegalError"
      this.setData({
        [illegalKey]: false
      })
    }
  },
  //货物类型下拉框选择事件
  bindPickerChange: function (obj) {
    var recordIndex = obj.currentTarget.dataset.index  //记录项序号

    var key = "outWareHouseRecords[" + recordIndex + "].pickerIndex"
    this.setData({
      [key]: obj.detail.value
    })
  },

  //删除出库记录
  deleteRecord: function(obj) {
    var recordIndex = obj.currentTarget.dataset.index  //记录项序号

    this.data.outWareHouseRecords.splice(recordIndex, 1)
    this.setData({
      outWareHouseRecords: this.data.outWareHouseRecords
    })
  },
  //添加出库记录
  addRecord: function() {
    this.setData({
      outWareHouseRecords: this.data.outWareHouseRecords.concat([{
        "pickerIndex": 0,
        "num": null
      }])
    })
  },

  //提交出库记录
  submitOutWarehouseRecords: function (obj) {
    //完整性检查
    if (this.data.outWareHouseRecords.length == 0) {   //记录条数是否为0
      wx.showToast({
        title: "请填写至少一条出库记录!",
        icon: "none"
      })

      return
    }
    for (var recordIndex in this.data.outWareHouseRecords){
      if (this.data.outWareHouseRecords[recordIndex].num == null || this.data.outWareHouseRecords[recordIndex].num.length == 0){  //是否为空
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
      else if (!/^[1-9][0-9]*$/.test(this.data.outWareHouseRecords[recordIndex].num)){  /*是否非数字*/
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
    for (let record of this.data.outWareHouseRecords){
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
    console.log(formattedRecords)

    //向后台请求提交出库记录
    var that = this
    wx.request({
      url: app.globalData.serverAddress + "/activity/api/area/warehouse/buildBatchOutStockRecord",  //none
      data: {
        "instanceId": that.data.processInstanceId,
        "records": formattedRecords,
        "comment": that.data.remarks.content
      },
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
          //提交成功则退出页面
          setTimeout(function () {
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

  //读取所有货物类型列表
  requesegetCargoList: function() {
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
            loadingCompleted: true,
            loadingCargoError: false,
            messageTitle: "无货物列表信息"
          })

          //页面加载完毕
          wx.hideLoading()
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
    //读取页面参数
    this.setData({
      processInstanceId: options.processInstanceId,
      processInstanceName: options.processInstanceName
    })
    //页面加载中
    wx.showLoading({
      title: '加载中',
    })

    //读取所有货物类型列表
    this.requesegetCargoList()
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