// pages/assign/assign.js
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    processId: null,            //流程ID
    processInstanceId: null,    //流程实例ID
    taskId: null,               //任务节点ID
    taskName: null,             //任务节点名称

    assignableUsers: null,      //可指派任务的人员列表
    assignableUsersStr: [],     //可指派任务的人员列表，字符串形式
    pickerIndex: 0,             //选择框索引值

    loadingCompleted: false,    //页面是否加载完毕
    hasSubmitted: false,        //是否提交成功，防止重复提交
  },

  //下拉框选择事件
  bindPickerChange: function(obj){
    this.setData({
      pickerIndex: obj.detail.value
    })
  },

  //提交任务分配结果
  submitAssignment: function(obj){
    var that = this
    //弹窗确认
    wx.showModal({
      title: "提示",
      content: "确定要给" + that.data.assignableUsers[that.data.pickerIndex].alias + "分配" + that.data.taskName + "吗？",
      confirmText: "确认",
      cancelText: "取消",
      success: function (res) {
        if (res.confirm) {  //用户点击确认
          //防止重复提交
          that.setData({
            hasSubmitted: true
          })
          //提交分配结果
          wx.request({
            url: app.globalData.serverAddress + "/api/task/assignTask",
            data: {
              "username": app.globalData.userInfo.username,
              "processId": that.data.processId,
              "processInstanceId": that.data.processInstanceId,
              "taskId": that.data.taskId,
              "assignee": that.data.assignableUsers[that.data.pickerIndex]
            },
            method: 'POST',
            header: {
              'content-type': 'application/json',
            },
            success: function (res) {
              if (res.data.status == 0) {
                wx.showToast({
                  title: "提交成功",
                })
                //提交成功则退出页面
                setTimeout(function () {
                  var pages = getCurrentPages();//获取页面栈
                  if (pages.length > 1) {
                    var prePage = pages[pages.length - 2];  //上一个页面实例对象
                    prePage.onLoad()    //刷新上一级页面
                  }
                  wx.navigateBack({
                    delta: 1
                  })  //退出页面
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
              if (app.globalData.useFakeData){
                //假数据
                wx.showToast({
                  title: "提交成功",
                })
                //提交成功则退出页面
                setTimeout(function () {
                  var pages = getCurrentPages();//获取页面栈
                  if (pages.length > 1) {
                    var prePage = pages[pages.length - 2];  //上一个页面实例对象
                    prePage.onLoad()    //刷新上一级页面
                  } 
                  wx.navigateBack({
                    delta: 1
                  })  //退出页面
                }, 1500)
              }
              else{
                wx.showToast({
                  title: '错误:' + res.errMsg,
                  icon: 'none'
                })
                //若提交失败，允许再次提交
                that.setData({
                  hasSubmitted: false
                })
              }
            }
          })
        }
      }
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    //页面加载中
    wx.showLoading({
      title: ''
    })
    //获取页面参数和全局变量
    this.setData({
      processId: options.processId,
      processInstanceId: options.processInstanceId,
      taskId: options.taskId,
      taskName: options.taskName
    })
    //设置页面标题
    wx.setNavigationBarTitle({
      title: options.taskName,
    })
    
    var that = this
    //请求获取可调配人员名单
    wx.request({
      url: app.globalData.serverAddress + "/api/task/getAssignableUsers",
      data: {
        "username": app.globalData.userInfo.username,
        "processId": that.data.processId,
        "processInstanceId": that.data.processInstanceId,
        "taskId": that.data.taskId
      },
      method: 'POST',
      header: {
        'content-type': 'application/json',
      },
      success: function (res) {
        if (res.data.status == 0) {
          that.setData({
            assignableUsers: res.data.users
          })
          //转成字符串形式的数据，方便显示在前端
          for (let assignee of res.data.users){
            that.setData({
              assignableUsersStr: that.data.assignableUsersStr.concat(assignee.alias + " " + assignee.phoneNumber + " " + assignee.position)
            })
          }
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
          var assignableUsers = []
          assignableUsers.push({
            "username": "123",
            "alias": "赵老六",
            "phoneNumber": "18123365894",
            "position": "保安"
          }, {
              "username": "152",
              "alias": "小花",
              "phoneNumber": "18825669984",
              "position": "清洁"
            }, {
              "username": "121783",
              "alias": "Alex",
              "phoneNumber": "15533362148",
              "position": "领导"
            }, {
              "username": "16623",
              "alias": "王境泽",
              "phoneNumber": "13955669754",
              "position": "搬运"
            })
          that.setData({
            assignableUsers: assignableUsers,
          })
          //转成字符串形式的数据，方便显示在前端
          for (let assignee of assignableUsers) {
            that.setData({
              assignableUsersStr: that.data.assignableUsersStr.concat(assignee.alias + "  " + assignee.phoneNumber + "  " + assignee.position)
            })
          }
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