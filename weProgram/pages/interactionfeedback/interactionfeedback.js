// pages/interactionfeedback/interactionfeedback.js
const app = getApp()
//引入日期选择器
var datePicker = require('../../utils/datepicker.js');
//引入UUID生成器
const uuid = require("../../utils/uuid.js")

Page({

  /**
   * 页面的初始数据
   */
  data: {
    username: null,   //用户账号
    processId: null,  //流程ID
    processInstanceId: null,  //流程实例ID

    date:{    //和商家互动的日期选择框
      dateArr: null,                  //日期数组(6维, 每个维度代表年月日时分秒的列表)
      dateIndex: [0, 0, 0, 0, 0, 0],  //当前显示的日期在数组中的索引
      dateIndexOrigin: [0, 0, 0, 0, 0, 0],  //点开下拉框之前的索引值
      illegalError: false             //输入信息是否非法，如未填
    },
    interactionImages:{       //和商家互动的截图
      imageUrls: [],      //图片Url
      illegalError: false   //输入信息是否非法，如未填
    },
    remarks:{           //和商家互动的备注
      content: "",      //内容
      count: 0,           //字数统计
      illegalError: false //输入信息是否非法，如未填
    },

    hasSubmitted: false,  //是否已经提交成功，防止重复提交
  },

  //统计并限制文本域字数
  bindTextAreaInput: function (obj) {
    //统计字数
    var count = obj.detail.cursor
    //是否超出限制
    if (count <= 200) {
      this.data.remarks.content = obj.detail.value
      this.data.remarks.count = count
      this.setData({
        remarks: this.data.remarks
      })
    }
  },

  //显示图片全图
  previewImage: function (obj) {
    wx.previewImage({
      current: obj.currentTarget.id, // 当前显示图片的http链接
      urls: this.data.interactionImages.imageUrls // 需要预览的全部图片http链接列表
    })
  },
  //选择图片
  chooseImages: function (obj) {
    //限制图片的数量
    var maxNumber = 9 - this.data.interactionImages.imageUrls.length
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
          ["interactionImages.imageUrls"]: that.data.interactionImages.imageUrls.concat(res.tempFilePaths)
        });

        //取消报错信息
        if (that.data.interactionImages.illegalError == true){
          that.setData({
            ["interactionImages.illegalError"]: false
          })
        }
      }
    })
  },
  //删除图片
  deleteImage: function (obj) {
    this.data.interactionImages.imageUrls.splice(obj.currentTarget.dataset.imageindex, 1)
    this.setData({
      ["interactionImages.imageUrls"]: this.data.interactionImages.imageUrls
    });
  },
  //日期选择器
  bindDateChange: function (obj) {  //点击确定
    this.setData({
      ["date.dateIndex"]: obj.detail.value,
      ["date.dateIndexOrigin"]: JSON.parse(JSON.stringify(obj.detail.value))
    })
  },
  bindDateCancel: function (obj) {  //点击取消
    this.setData({
      ["date.dateIndex"]: JSON.parse(JSON.stringify(this.data.date.dateIndexOrigin))
    })
  },
  bindDateColumnChange: function (obj) {  //滚动列时
    var column = obj.detail.column    //选择框滚动的列号
    var currentDateIndex = this.data.date.dateIndex  //当前显示日期的索引值

    currentDateIndex[column] = obj.detail.value
    //若年份或月份更换，每月天数也要替换
    if (column == 0 || column == 1) {
      var dayArr = datePicker.getMonthDay(this.data.date.dateArr[0][currentDateIndex[0]],
        this.data.date.dateArr[1][currentDateIndex[1]])
      if (currentDateIndex[2] >= dayArr[dayArr.length - 1]) //每月天数减小时，越界处理
      {
        currentDateIndex[2] = dayArr[dayArr.length - 1] - 1
        console.log(currentDateIndex[2])
      }

      this.setData({
        ["date.dateArr[2]"]: dayArr,
        ["date.dateIndex"]: currentDateIndex
      })
    }
    else {
      this.setData({
        ["date.dateIndex"]: currentDateIndex
      })
    }
  },

  //向后台请求提交互动记录
  requestSubmitInteraction: function (interactionId) {
    var that = this

    wx.request({
      url: app.globalData.serverAddress + "/activity/api/interaction/submitInteraction",
      data: {
        "username": app.globalData.userInfo.username,
        "processId": that.data.processId,
        "processInstanceId": that.data.processInstanceId,
        "interactionId": interactionId,
        "content": this.data.remarks.content,
        "imageUrls": that.data.interactionImages.imageUrls.map(imageUrl => {
          return imageUrl.replace(app.globalData.serverAddress + "/activity", "")
        }),
        "date": this.data.date.dateArr[0][this.data.date.dateIndex[0]] + "-"
          + this.data.date.dateArr[1][this.data.date.dateIndex[1]] + "-"
          + this.data.date.dateArr[2][this.data.date.dateIndex[2]] + " 00:00:00"
          // + this.data.date.dateArr[3][this.data.date.dateIndex[3]] + ":"
          // + this.data.date.dateArr[4][this.data.date.dateIndex[4]] + ":"
          // + this.data.date.dateArr[5][this.data.date.dateIndex[5]],
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
  //向后台请求上传互动截图
  requestUploadInteractionImage(currentImageNum, interactionId) {
    var filePath = this.data.interactionImages.imageUrls[this.data.interactionImages.imageUrls.length - currentImageNum]
    if (filePath.includes(app.globalData.serverAddress)){ //已在服务器中的图片跳过
      currentImageNum -= 1
      //若所有图片均已上传完毕，提交文字描述和图片Url
      if (currentImageNum <= 0) { //提交文本数据
        this.requestSubmitInteraction(interactionId)
      }
      else { //若未全部上传完毕，继续上传
        this.requestUploadInteractionImage(currentImageNum, interactionId)
      }

      return
    }

    var that = this
    wx.uploadFile({
      url: app.globalData.serverAddress + '/activity/api/interaction/uploadImage',
      filePath: filePath,
      name: 'file',
      formData: {
        "username": that.data.username,
        "interactionId": interactionId,
        // "totalNum": that.data.interactionImages.imageUrls.length
      },
      method: 'POST',
      header: {
        "Content-Type": "multipart/form-data",
        'accept': 'application/json',
        "Authorization": "Bearer " + app.globalData.userInfo.access_token
      },
      success: function (res) {
        console.log(res)
        var data = JSON.parse(res.data)  //wx.uploadFile返回的是字符串，需要转换为JSON格式
        if (data.status == 0) {
          ////将图片Url替换为服务器中存储的Url
          that.data.interactionImages.imageUrls[that.data.interactionImages.imageUrls.length - currentImageNum] = app.globalData.serverAddress + "/activity" + data.url

          currentImageNum -= 1
          //若所有图片均已上传完毕，提交文字描述和图片Url
          if (currentImageNum <= 0) { //提交文本数据
            that.requestSubmitInteraction(interactionId)
          }
          else { //若未全部上传完毕，继续上传
            that.requestUploadInteractionImage(currentImageNum, interactionId)
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
      fail: function (res) {
        wx.showToast({
          title: '错误:' + res.errMsg,
          icon: 'none'
        })
        //若提交失败，允许再次提交
        that.setData({
          hasSubmitted: true
        })
      }
    })
  },
  //提交互动记录
  submitInteraction: function (obj) {
    //检查完整性
    if (this.data.interactionImages.imageUrls == null || this.data.interactionImages.imageUrls.length == 0){
      this.setData({
        ["interactionImages.illegalError"]: true
      })
      wx.showToast({
        title: "请上传与商家互动的消息截图！",
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

    //先上传图片到服务器，再提交图片url链接和文本信息
    this.requestUploadInteractionImage(JSON.parse(JSON.stringify(this.data.interactionImages.imageUrls.length)), uuid.getUuid())
  },



  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    //读取页面参数和全局变量
    this.setData({
      username: app.globalData.userInfo.username,
      processId: options.processId,
      processInstanceId: options.processInstanceId
    })

    //设置日期选择框值
    this.setData({
      date: datePicker.datePicker(2000, 2050)
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