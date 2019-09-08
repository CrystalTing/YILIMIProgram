// pages/feedback/feedback.js
const app = getApp()
//引入UUID生成器
const uuid = require("../../utils/uuid.js")

Page({

  /**
   * 页面的初始数据
   */
  data: {
    count: 0,             //文本域计数
    feedbackImages: [],           //图片描述列表

    hasSubmitted: false,  //是否已经提交成功
  },

  //统计并限制文本域字数
  bindTextAreaInput: function(obj){
    //统计字数
    var count = obj.detail.cursor
    //是否超出限制
    if (count <= 200) {
      this.setData({
        "count": count
      })
    }
  },

  //显示图片全图
  previewImage: function (obj) {
    wx.previewImage({
      current: obj.currentTarget.id, // 当前显示图片的http链接
      urls: this.data.feedbackImages // 需要预览的全部图片http链接列表
    })
  },
  //选择图片
  chooseImages: function (obj) {
    //限制图片的数量
    var maxNumber = 9 - this.data.feedbackImages.length
    if (maxNumber <= 0) {
      wx.showToast({
        title: '最多只能上传' + 9 + '张图片',
        icon: 'none'
      })
      return
    }

    var that = this
    wx.chooseImage({
      count: maxNumber,
      sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
      success: function (res) {
        //检测图片大小是否超出限制
        for (let image of res.tempFiles) {
          if (image.size > 1048576) {
            wx.showToast({
              title: '图片大小不能超过1M',
              icon: 'none'
            })
            return
          }
        }
        // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
        that.setData({
          feedbackImages: that.data.feedbackImages.concat(res.tempFilePaths)
        });
      }
    })
  },
  //删除图片
  deleteImage: function (obj) {
    this.data.feedbackImages.splice(obj.currentTarget.dataset.imageindex, 1)
    this.setData({
      feedbackImages: this.data.feedbackImages
    });
  },

  //向后台请求提交反馈
  requestSubmitFeedback: function (feedbackDetails, feedbackId){
    var that = this

    wx.request({
      url: app.globalData.serverAddress + "/activity/api/feedback/submitFeedback",  //none
      data: {
        "username": app.globalData.userInfo.username,
        "feedbackId": feedbackId,
        "feedback": feedbackDetails,
        "imageUrls": that.data.feedbackImages.map(imageUrl => {
          return imageUrl.replace(app.globalData.serverAddress + "/activity", "")
        }),
      },
      method: 'POST',
      header: {
        'content-type': 'application/json',
        "Authorization": "Bearer " + app.globalData.userInfo.access_token
      },
      success: function (res) {
        if (res.data.status == 0) { //表单文本数据提交成功
          wx.showToast({
            title: '感谢您的反馈！'
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
  //向后台请求上传反馈截图
  requestUploadFeedbackImage(currentImageNum, feedbackDetails, feedbackId){
    var filePath = this.data.feedbackImages[this.data.feedbackImages.length - currentImageNum]
    if (filePath.includes(app.globalData.serverAddress)) { //已在服务器中的图片跳过
      currentImageNum -= 1
      //若所有图片均已上传完毕，提交文字描述和图片Url
      if (currentImageNum <= 0) { //提交文本数据
        this.requestSubmitFeedback(feedbackDetails, feedbackId)
      }
      else { //若未全部上传完毕，继续上传
        this.requestUploadFeedbackImage(currentImageNum, feedbackDetails, feedbackId)
      }

      return
    }

    var that = this
    wx.uploadFile({
      url: app.globalData.serverAddress + '/activity/api/feedback/uploadImage',
      filePath: filePath,
      name: 'file',
      formData: {
        "feedbackId": feedbackId,
        "username": that.data.username,
        "totalNum": that.data.feedbackImages.length
      },
      method: 'POST',
      header: {
        "Content-Type": "multipart/form-data",
        'accept': 'application/json',
        "Authorization": "Bearer " + app.globalData.userInfo.access_token
      },
      success: function(res){
        console.log(res)
        var data = JSON.parse(res.data)  //wx.uploadFile返回的是字符串，需要转换为JSON格式
        if (data.status == 0) {
          ////将图片Url替换为服务器中存储的Url
          that.data.feedbackImages[that.data.feedbackImages.length - currentImageNum] = app.globalData.serverAddress + "/activity" + data.url

          currentImageNum -= 1
          //若所有图片均已上传完毕，提交文字描述和图片Url
          if (currentImageNum <= 0) { //提交文本数据
            that.requestSubmitFeedback(feedbackDetails, feedbackId)
          }
          else { //若未全部上传完毕，继续上传
            that.requestUploadFeedbackImage(currentImageNum, feedbackDetails, feedbackId)
          }
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
            title: data.message,
            icon: 'none'
          })
          //若提交失败，允许再次提交
          that.setData({
            hasSubmitted: false
          })
        }
      },
      fail: function(res){
        if (app.globalData.useFakeData) {
          //假数据
          //提交表单其他文本数据
          that.requestSubmitFeedback(feedbackDetails)
        }
        else {
          wx.showToast({
            title: '错误:' + res.errMsg,
            icon: 'none'
          })
          //若提交失败，允许再次提交
          that.setData({
            hasSubmitted: true
          })
        }
      }
    })
  },
  //提交反馈
  submitFeedback: function(obj){
    var feedbackDetails = obj.detail.value["feedback"]  //反馈文字描述
    //检查完整性
    if(feedbackDetails == null || feedbackDetails.length == 0){
      wx.showToast({
        title: "请填写反馈文字描述！",
        icon: "none"
      })
      return
    }

    //防止重复提交
    this.setData({
      hasSubmitted: true
    })
    wx.showLoading({
      title: "提交中",
    })

    console.log(uuid.getUuid())
    if(this.data.feedbackImages.length == 0){ //若无图片截图，直接上传反馈信息
      this.requestSubmitFeedback(feedbackDetails, uuid.getUuid())
    }
    else{ //若有图片截图，先上传图片到服务器
      this.requestUploadFeedbackImage(JSON.parse(JSON.stringify(this.data.feedbackImages.length)), feedbackDetails, uuid.getUuid())
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    
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