// pages/assignabletasks/assignabletasks.js
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    processId: null,      //当前流程ID
    processName: null,    //当前流程名称

    tasks: null,          //待分配任务
    assignedTasks: null,  //已分配任务

    loadingCompleted: false,  //页面加载完成
  },

  //跳转至取消分配页面
  toCancelAssignPage: function (obj) {
    var index = obj.currentTarget.dataset.index       //已分配的任务的序号
    var assignedTask = this.data.assignedTasks[index] //已分配任务详细信息

    wx.navigateTo({
      url: "../cancelassign/cancelassign?processId=" + assignedTask.processId + "&processInstanceId="
        + assignedTask.processInstanceId + "&taskId=" + assignedTask.taskId
        + "&taskName=" + assignedTask.taskName + "&assignee=" + JSON.stringify(assignedTask.assignee),
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log("加载")
    //页面加载中
    wx.showLoading({
      title: ''
    })
    if(options){
      //获取页面参数和全局变量
      this.setData({
        processId: options.processId,
        processName: options.processName
      })
      //设置页面标题
      wx.setNavigationBarTitle({
        title: this.data.processName,
      })
    }

    var that = this
    //请求获取当前待分配任务
    wx.request({
      url: app.globalData.serverAddress + "/api/task/getAssignableTasks",
      data:{
        "username": app.globalData.userInfo.username,
        "processId": that.data.processId
      },
      method: 'POST',
      header: {
        'content-type': 'application/json',
      },
      success: function (res) {
        console.log(res)
        if (res.data.status == 0) {
          that.setData({
            tasks: res.data.tasks
          })
        }
        else {
          wx.showToast({
            title: res.data.message,
            icon: 'none'
          })
        }
      },
      fail: function (res) {
        if (app.globalData.useFakeData){
          //假数据
          var tasks = []
            tasks.push({
              "processInstanceId": "1",
              "processInstanceName": "海底捞餐饮店一",
              "taskId": "1",
              "taskName": "上传基本照片一"
            },{
              "processInstanceId": "1",
                "processInstanceName": "海底捞餐饮店一",
              "taskId": "2",
                "taskName": "填报企业评估表二"
              }, {
                "processInstanceId": "1",
                "processInstanceName": "海底捞餐饮店一",
                "taskId": "4",
                "taskName": "企业现场勘测四"
              }, {
                "processInstanceId": "3",
                "processInstanceName": "美团餐饮店三",
                "taskId": "2",
                "taskName": "材料确认二"
              })
          that.setData({
            tasks: tasks,
          })
        }
        else{
          wx.showToast({
            title: '错误:' + res.errMsg,
            icon: 'none'
          })
        }
      }
    })

    //请求获取当前已分配任务
    wx.request({
      url: app.globalData.serverAddress + "/api/task/getAssignedTasks",
      data: {
        "username": app.globalData.userInfo.username,
        "processId": that.data.processId
      },
      method: 'POST',
      header: {
        'content-type': 'application/json',
      },
      success: function (res) {
        console.log(res)
        if (res.data.status == 0) {
          that.setData({
            assignedTasks: res.data.tasks
          })
        }
        else {
          wx.showToast({
            title: res.data.message,
            icon: 'none'
          })
        }
      },
      fail: function (res) {
        if (app.globalData.useFakeData){
          //假数据
          var assignedTasks = []
          assignedTasks.push({
            "processInstanceId": "1",
            "processInstanceName": "海底捞餐饮店一",
            "taskId": "3",
            "taskName": "现场勘测三",
            "assignee": {
              "username": "27353",
              "alias": "蔡徐坤",
              "phoneNumber": "17788564123",
              "position": "唱跳rap篮球"
            }
          }, {
              "processInstanceId": "2",
              "processInstanceName": "饿了么餐饮店二",
              "taskId": "1",
              "taskName": "上传基本照片一",
              "assignee": {
                "username": "11986",
                "alias": "李永乐",
                "phoneNumber": "15123698854",
                "position": "音乐演奏"
              }
            }, {
              "processInstanceId": "2",
              "processInstanceName": "饿了么餐饮店二",
              "taskId": "2",
              "taskName": "材料确认二",
              "assignee": {
                "username": "99562",
                "alias": "Gabe LoganNewell",
                "phoneNumber": "18233654955",
                "position": "促销"
              }
            })
          that.setData({
            assignedTasks: assignedTasks,
          })
        }
        else{
          wx.showToast({
            title: '错误:' + res.errMsg,
            icon: 'none'
          })
        }
      },
      complete: function (res) {
        //页面加载完毕
        that.setData({ loadingCompleted: true })
        wx.hideLoading()
      }
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