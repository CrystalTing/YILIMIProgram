// pages/workHistory/workHistory.js
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    username: null,       //用户账号
    workHistories: null,  //工作记录表
    pageIndex: 1,         //当前页码
    maxPageIndex: null,   //最大页数
    pageSize: 10,       //一页显示的工作记录条数
    totalNumber: null,    //总工作记录条数

    loadingCompleted: false,  //页面加载完成
  },

  //返回上一级页面
  backToLastPage: function () {
    wx.navigateBack({
      delta: 1
    })
  },

  toLastPage: function(obj){    //上一页
    this.setData({
      pageIndex: this.data.pageIndex - 1
    })
    this.getWorkHistories(this.data.pageIndex, this.data.pageSize)
  },
  toNextPage: function (obj) {  //下一页
    this.setData({
      pageIndex: this.data.pageIndex + 1
    })
    this.getWorkHistories(this.data.pageIndex, this.data.pageSize)
  },
  jumpPage: function(obj){ //跳转页码
    var itemList = []  //可选的有效页码
    for(var index = 1; index <= this.data.maxPageIndex; index++){
      itemList.push(JSON.stringify(index))
    }

    var that = this
    wx.showActionSheet({
      itemList: itemList,
      success: function(res){
        that.setData({
          pageIndex: res.tapIndex + 1
        })
        that.getWorkHistories(res.tapIndex + 1, that.data.pageSize)
      }
    })
  },

  getWorkHistories(pageIndex, pageSize){  //根据页码读取工作记录
    //请求获取用户工作记录
    var that = this
    var requestData = {
      "username": this.data.username,   //用户账号
      "page": pageIndex,           //页码
      "pageSize": pageSize,                 //一次获取的记录数量
    }
    console.log(requestData)
    console.log({ "Authorization": "Bearer " + app.globalData.userInfo.access_token})
    wx.request({
      url: app.globalData.serverAddress + '/activity/api/manager/getWorkHistory',  //none
      data: requestData,
      method: 'POST',
      header: {
        'content-type': 'application/json',
        "Authorization": "Bearer " + app.globalData.userInfo.access_token
      },
      success: function (res) {
        console.log(res)
        if (res.data.status == 0) {
          that.setData({
            workHistories: res.data.tasks,
            totalNumber: res.data.count,
            maxPageIndex: Math.ceil(res.data.count / that.data.pageSize),
            loadingCompleted: true,
            messageTitle: "无工作记录信息"
          })

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
            messageTitle: "无工作记录信息",
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
    //设置用户账号
    this.setData({
      username: app.globalData.userInfo.username
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
    //页面加载中
    wx.showLoading({
      title: '加载中'
    })
    //读取工作记录
    this.getWorkHistories(this.data.pageIndex, this.data.pageSize)
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
    //读取工作记录
    this.getWorkHistories(this.data.pageIndex, this.data.pageSize)
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