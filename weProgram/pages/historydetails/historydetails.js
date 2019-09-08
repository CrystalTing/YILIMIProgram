// pages/historydetails/historydetails.js
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    username: null,   //用户账号
    alias: null,      //用户姓名
    processId: null,  //项目ID
    processName: null,//项目名称
    processInstanceId: null,  //项目实例ID
    processInstanceName: null,//项目实例名称
    taskId: null,     //任务ID
    taskName: null,   //任务名(主页面有效)
    formId: null,     //若该页面为子页面,存储子表单ID
    formName: null,   //表单名(页面显示子表单时有效)
    commitTime: null, //提交时间
    form: null,       //表单内容

    isChild: false,           //是否为子页面

    loadingCompleted: false,  //页面加载完成
    loadingFormError: true,  //读取表单信息是否出错
  },

  //显示图片全图
  previewImage: function (obj) {
    wx.previewImage({
      current: obj.currentTarget.id,      // 当前显示图片的http链接
      urls: this.data.form[obj.currentTarget.dataset.index].value // 需要预览的图片http链接列表
    })
  },

  //修改表单数据格式并设置输入框数据缓存和合法性验证缓存
  readForm: function (form, subFormsNum) {
    for (let item of form) {
      switch (item.type) {
        case "RADIO_BOX": { //单选框
          var radioChecked = []
          for (let value of item.valueList) {
            if (value == item.value) {
              radioChecked.push(true)
            }
            else {
              radioChecked.push(false)
            }
          }
          item["boxCache"] = radioChecked
          break
        }
        case "CHECK_BOX": { //多选框
          var checkBoxChecked = []
          for (let value of item.valueList) {
            if (item.value != null && item.value != "") {  //若有默认值或是之前保存过的数据则设置
              if (item.value.includes(value)) {
                checkBoxChecked.push(true)
              }
              else {
                checkBoxChecked.push(false)
              }
            }
            else {
              checkBoxChecked.push(false)
            }
          }
          item["boxCache"] = checkBoxChecked
          break
        }
        case "IMAGE": {  //图片选择框
          if (item.value != null && item.value != "") {  //若有默认值或是之前保存过的数据则设置
            var images = []
            for (let imageUrl of item.value.split(";")) {
              if (imageUrl.length != 0) {
                images.push(app.globalData.serverAddress + "/activity" + imageUrl)
              }
            }
            item.value = images
          }
          else {
            item.value = []
          }
          break
        }
        case "DATE": {  //日期
          //转换日期格式
          item.value = item.value.substring(0, 10)
          // item.value = item.value.substring(0, 19).replace("T", " ")
          break
        }
        case "FORM": {  //子表单
          console.log(item)
          var that = this
          //请求获取子表单数据
          console.log({
            "processId": that.data.processId,
            "processInstanceId": that.data.processInstanceId,
            "taskId": that.data.taskId,
            "formId": item.value})
          console.log("Bearer " + app.globalData.userInfo.access_token)
          wx.request({
            url: app.globalData.serverAddress + '/activity/api/manager/getSubFormDetail',
            data: {
              "processId": that.data.processId,
              "processInstanceId": that.data.processInstanceId,
              "formId": item.value
            },
            method: 'POST',
            header: {
              'content-type': 'application/json',
              "Authorization": "Bearer " + app.globalData.userInfo.access_token
            },
            success: function (res) {
              console.log(res)
              if (res.data.status == 0) { //请求数据成功
                subFormsNum -= 1
                //读取返回的表单数据
                item["boxCache"] = res.data.subForm.properties
                //继续读取子表单数据
                that.readForm(item["boxCache"])

                //页面加载完毕
                if (subFormsNum <= 0) {
                  that.setData({
                    loadingCompleted: true,
                    loadingFormError: false
                  })
                  wx.hideLoading()
                }
              }
              else if (res.statusCode == 401) { //token无效则返回登录页面
                delete app.globalData.userInfo
                wx.removeStorageSync('userInfo')

                that.setData({
                  loadingFormError: true,
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
                  loadingFormError: true,
                  messageTitle: "获取子表单信息失败",
                  messageDetails: res.data.message
                })
                //页面加载完毕
                wx.hideLoading()
                console.log(item.value)
              }
            },
            fail: function (res) {
              that.setData({
                loadingFormError: true,
                messageTitle: "操作失败",
                messageDetails: res.errMsg
              })
              //页面加载完毕
              wx.hideLoading()
            }
          })

          break
        }
        default:{
          item["boxCache"] = []
        }
      }
    }
  },

  //请求表单历史数据
  requestGetFormDetails: function () {
    //页面加载中
    wx.showLoading({
      title: '加载中'
    })

    var that = this
    var requestData = {
      "username": this.data.username,
      "processId": this.data.processId,
      "processInstanceId": this.data.processInstanceId,
      "taskId": this.data.taskId
    }
    wx.request({
      url: app.globalData.serverAddress + '/activity/api/manager/getTaskDataDetail',  //none
      data: requestData,
      method: 'POST',
      header: {
        'content-type': 'application/json',
        "Authorization": "Bearer " + app.globalData.userInfo.access_token
      },
      success: function (res) {
        console.log(res)
        if (res.data.status == 0) {
          for (let subForm of res.data.task.subForms) { //读取子表单类型项
            res.data.task.properties.push({
              "name": subForm.formName,
              "value": subForm.formId,
              "type": "FORM"
            })
          }
          var subFormsNum = res.data.task.subForms.length    //子表单数量
          //修改表单内容格式
          that.readForm(res.data.task.properties, subFormsNum)

          //读取表单内容
          that.setData({
            form: res.data.task.properties
          })
          //页面加载完毕
          if (subFormsNum <= 0) {
            that.setData({
              loadingCompleted: true,
              loadingFormError: false
            })
            wx.hideLoading()
          }
          console.log(that.data.form)
        }
        else if (res.statusCode == 401) { //token无效则返回登录页面
          delete app.globalData.userInfo
          wx.removeStorageSync('userInfo')

          that.setData({
            loadingCompleted: true,
            loadingFormError: true,
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
            loadingFormError: true,
            messageTitle: "无表单内容",
            messageDetails: res.data.message
          })
          //页面加载完毕
          wx.hideLoading()
        }
      },
      fail: function (res) {
        that.setData({
          loadingCompleted: true,
          loadingFormError: true,
          messageTitle: "操作失败",
          messageDetails: res.errMsg
        })
        //页面加载完毕
        wx.hideLoading()
      }
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    //获取页面参数和全局变量
    this.setData({
      username: app.globalData.userInfo.username,
      alias: app.globalData.userInfo.alias,
      processId: options.processId,
      processName: options.processName,
      processInstanceId: options.processInstanceId,
      processInstanceName: options.processInstanceName,
      taskId: options.taskId,
      taskName: options.taskName,
      isChild: JSON.parse(options.isChild)
    })
    if (options.commitTime != null){
      this.setData({
        commitTime: options.commitTime
      })
    }
    
    if(this.data.isChild == true){  //子页面
      var pages = getCurrentPages();  //获取页面栈
      var mainFormPage = pages[pages.length - 2];  //获取主表单页面
      //获取主表单数据的引用
      for (let item of mainFormPage.data.form) {
        if (item.value == options.formId) {
          this.setData({
            form: item.boxCache,
            formId: options.formId,
            formName: options.formName,
            loadingFormError: false,
            loadingCompleted: true
          })
          break
        }
      }
      //设置标题
      wx.setNavigationBarTitle({
        title: options.formName
      })

      return
    }
    else{           //主页面
      //设置标题
      wx.setNavigationBarTitle({
        title: options.taskName
      })
    }

    this.requestGetFormDetails()
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