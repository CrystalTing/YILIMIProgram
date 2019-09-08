// pages/activation/activation.js
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    username: null,       //用户账号名
    processId: null,      //流程ID
    processName: null,    //流程名称
  },

  //启动流程实例
  activateProcessInstance: function (obj) {
    //检测输入框是否为空
    var processInstanceName = obj.detail.value["processInstanceName"]
    if (processInstanceName == null || processInstanceName == ""){
      wx.showToast({
        title: "实例名称不能为空!",
        icon: "none"
      })
      return
    }

    var that = this
    //弹窗警告
    wx.showModal({
      title: "提示",
      content: "启动流程后不可停止，只能由后台管理员删除，确定要继续吗？",
      confirmText: "启动流程",
      cancelText: "取消操作",
      success: function (res) {
        console.log(res);
        if (res.confirm) {  //确认启动流程实例
          console.log('用户点击主操作')
          //向后台获取流程实例ID
          wx.request({
            url: app.globalData.serverAddress + "/api/process/startProcess",
            data: {
              "username": that.data.username,
              "processId": that.data.processId,
              "processInstanceName": processInstanceName
            },
            method: 'POST',
            header: {
              'content-type': 'application/json',
            },
            success: function (res) {
              if (res.data.status == 0) {
                //若请求成功，则跳转页面让用户填启动流程的表单
                wx.redirectTo({
                  url: "../form/form?processId=" + that.data.processId + "&processInstanceId=" + res.data.processInstanceId,
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
                wx.redirectTo({
                  url: "../form/form?processId=" + that.data.processId + "&processInstanceId=10000",
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
        }
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
      processId: options.processId,
      processName: options.processName
    })
    //设置标题
    wx.setNavigationBarTitle({
      title: this.data.processName + "启动",
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