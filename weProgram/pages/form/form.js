// pages/Text/Text.js
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
    navbarIndex: 0, //顶部导航栏序号

    username: null, //用户账号
    processId: null, //项目ID
    processInstanceId: null, //项目实例ID
    taskId: null, //任务节点ID
    taskName: null, //任务名称(主页面有效)
    formId: null, //若该页面为子页面,存储子表单ID
    formName: null, //表单名称(页面为子表单时有效)
    form: null, //表单内容
    /*
    form:[{
      "propertyId": "",           //表单项ID
      "name": "",                 //表单项名称
      "type":                     //表单项输入框类型
        "TEXT_BOX" ||     //单行文本框
        "TEXT_AREA" ||    //多行文本框
        "SELECT" ||       //下拉选择框
        "RADIO_BOX" ||    //单选框
        "CHECK_BOX" ||    //多选框
        "IMAGE" ||        //图片
        "DATE" ||         //日期选择框
        "FORM",           //子表单
      "defaultExpression": "",    //默认显示值
      "valueList": "",            //可选择数据列表，仅当输入框类型为"SELECT","RADIO_BOX","CHECK_BOX"时有效
      "writeable": true || false, //是否可填写,false表示只读
      "showable": true || false,  //是否可显示,false在界面隐藏该表单项
      "required": true || false,  //是否为必填项
      "illegalError": true || false //该项输入时是否检测到非法输入(如为空)
      "boxCache": "" || [],       //各输入框数据缓存，用于方便页面显示，输入框存储数据根据其类型有所不同：
                                  // 文本域：文本域字数,
                                  // 下拉选择框：当前选择的内容索引号,
                                  // 单选框和多选框：勾选情况(boolean数组),
                                  // 图片：预览的所有图片Url列表(String数组)},
                                  // 日期: {
                                    dateArr: 日期数组(6维,每个维度代表年月日时分秒的列表)
                                    dateIndex: 当前显示的日期在数组中的索引
                                  }
                                  // 子表单: 子表单项form内容,可嵌套
    }]*/
    evaluation: { //上一岗评价
      "content": "GOOD", //内容
      "illegalError": false //该项输入时是否检测到非法输入(如为空)
    },
    badReason: { //差评理由
      "content": null, //内容
      "count": 0, //字数统计
      "illegalError": false //该项输入时是否检测到非法输入(如为空)
    },
    isChild: false, //是否为子页面
    hasSubmitted: false, //是否已成功提交表单，防止重复提交
    readOnly: true, //表单是否需要填写，即是否至少一个表单项是可写的，若全部字段未不可写则为只读表单
    hasClickedDownloaded: false, //是否已点击下载按钮,防止多次重复
    hasClickedOpen: false, //是否已经点击打开文件，防止重复点击
    docxFilePath: null, //电子文档路径

    //项目进度
    tasks: null, //项目中任务节点
    taskSequence: [], //任务顺序序列，并列的任务放入同一节点，如[[0],[1,2,3],[4]]，表示1、2、3为三个分支，项目从0流转到1、2、3再到4

    //项目反馈
    count: 0, //文本域计数
    feedbackImages: [], //图片描述列表
    feedbackHasSubmitted: false, //是否已成功提交反馈，防止重复提交

    loadingCompleted: false, //页面加载完成
    loadingFormError: false, //读取表单信息是否出错

    chargeAmount: 0,         //收费评估,仅在收费评估子表单有用
  },

  //返回上一级页面
  backToLastPage: function() {
    wx.navigateBack({
      delta: 1
    })
  },

  //顶部导航栏切换事件
  navtabClick: function(obj) {
    this.setData({
      navbarIndex: obj.currentTarget.id
    });
  },

  //向后台请求提交项目反馈
  requestSubmitFeedback: function(feedbackDetails, feedbackId) {
    var that = this

    wx.request({
      url: app.globalData.serverAddress + "/activity/api/feedback/submitProcessInstanceFeedback", //none
      data: {
        "username": app.globalData.userInfo.username,
        "feedbackId": feedbackId,
        "processId": that.data.processId,
        "processInstanceId": that.data.processInstanceId,
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
      success: function(res) {
        if (res.data.status == 0) { //表单文本数据提交成功
          wx.showToast({
            title: '感谢您的反馈！'
          })
          //提交成功后允许再次提交
          that.setData({
            feedbackHasSubmitted: false
          })
        } else if (res.statusCode == 401) { //token无效则返回登录页面
          delete app.globalData.userInfo
          wx.removeStorageSync('userInfo')

          wx.showToast({
            title: "登录信息已失效",
            icon: 'none'
          })
          setTimeout(function() {
            //返回登录页面
            wx.redirectTo({
              url: "../login/login"
            })
          }, 1500)
        } else {
          wx.showToast({
            title: res.data.message,
            icon: 'none'
          })
          //若提交失败，允许再次提交
          that.setData({
            feedbackHasSubmitted: false
          })
        }
      },
      fail: function(res) {
        wx.showToast({
          title: '错误:' + res.errMsg,
          icon: 'none'
        })
        //若提交失败，允许再次提交
        that.setData({
          feedbackHasSubmitted: false
        })
      }
    })
  },
  //向后台请求上传反馈截图
  requestUploadFeedbackImage(currentImageNum, feedbackDetails, feedbackId) {
    var filePath = this.data.feedbackImages[this.data.feedbackImages.length - currentImageNum]
    if (filePath.includes(app.globalData.serverAddress)) { //已在服务器中的图片跳过
      currentImageNum -= 1
      //若所有图片均已上传完毕，提交文字描述和图片Url
      if (currentImageNum <= 0) { //提交文本数据
        this.requestSubmitFeedback(feedbackDetails, feedbackId)
      } else { //若未全部上传完毕，继续上传
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
      success: function(res) {
        var data = JSON.parse(res.data) //wx.uploadFile返回的是字符串，需要转换为JSON格式
        if (data.status == 0) {
          ////将图片Url替换为服务器中存储的Url
          that.data.feedbackImages[that.data.feedbackImages.length - currentImageNum] = app.globalData.serverAddress + "/activity" + data.url

          currentImageNum -= 1
          //若所有图片均已上传完毕，提交文字描述和图片Url
          if (currentImageNum <= 0) { //提交文本数据
            that.requestSubmitFeedback(feedbackDetails, feedbackId)
          } else { //若未全部上传完毕，继续上传
            that.requestUploadFeedbackImage(currentImageNum, feedbackDetails, feedbackId)
          }
        } else if (res.statusCode == 401) { //token无效则返回登录页面
          delete app.globalData.userInfo
          wx.removeStorageSync('userInfo')

          wx.showToast({
            title: "登录信息已失效",
            icon: 'none'
          })
          setTimeout(function() {
            //返回登录页面
            wx.redirectTo({
              url: "../login/login"
            })
          }, 1500)
        } else {
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
      fail: function(res) {
        if (app.globalData.useFakeData) {
          //假数据
          //提交表单其他文本数据
          that.requestSubmitFeedback(feedbackDetails)
        } else {
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
  },
  //提交反馈
  submitFeedback: function(obj) {
    var feedbackDetails = obj.detail.value["feedback"] //反馈文字描述
    //检查完整性
    if (feedbackDetails == null || feedbackDetails.length == 0) {
      wx.showToast({
        title: "请填写反馈文字描述！",
        icon: "none"
      })
      return
    }

    //防止重复提交
    this.setData({
      feedbackHasSubmitted: true
    })
    wx.showLoading({
      title: "提交中",
    })

    if (this.data.feedbackImages.length == 0) { //若无图片截图，直接上传反馈信息
      this.requestSubmitFeedback(feedbackDetails, uuid.getUuid())
    } else { //若有图片截图，先上传图片到服务器
      this.requestUploadFeedbackImage(JSON.parse(JSON.stringify(this.data.feedbackImages.length)), feedbackDetails, uuid.getUuid())
    }
  },

  cancelIllegalError: function(obj) { //重新输入时，取消表单报错信息
    if (this.data.form[obj.currentTarget.dataset.index].illegalError) {
      var key = "form[" + obj.currentTarget.dataset.index + "].illegalError"
      this.setData({
        [key]: false
      })
    }
  },
  //单行文本框输入事件
  bindTextBoxInput: function(obj) {
    var index = obj.currentTarget.dataset.index //表单项序号

    this.data.form[index].defaultExpression = obj.detail.value
    //重新输入时，取消表单报错信息
    this.cancelIllegalError(obj)
  },
  //文本域输入时，统计字数
  bindTextAreaInput: function(obj) {
    var index = obj.currentTarget.dataset.index //表单项序号
    //统计字数
    var count = obj.detail.cursor
    //是否超出限制
    if (count <= 200) {
      if (index != null) { //表单
        var key = "form[" + index + "].boxCache"
        this.setData({
          [key]: count
        })
      } else { //项目反馈
        this.setData({
          "count": count
        })
      }
    }

    if (index != null) { //表单
      this.data.form[index].defaultExpression = obj.detail.value
      //重新输入时，取消表单报错信息
      this.cancelIllegalError(obj)
    }
  },
  //差评理由输入事件
  bindBadReasonTextAreaInput: function(obj) {
    //统计字数
    var count = obj.detail.cursor
    //是否超出限制
    if (count <= 200) {
      this.data.badReason.content = obj.detail.value
      this.data.badReason.count = count
      this.setData({
        badReason: this.data.badReason
      })
    }

    //重新输入时，取消表单报错信息
    if (this.data.badReason.illegalError == true) {
      this.setData({
        ["badReason.illegalError"]: false
      })
    }
  },
  //评价上一岗单选框选择事件
  bindEvaluationRadioChange: function(obj) {
    this.data.evaluation.content = obj.detail.value
    //重新输入时，取消表单报错信息
    if (this.data.evaluation.illegalError == true) {
      this.data.evaluation.illegalError = false
    }
    this.setData({
      evaluation: this.data.evaluation
    })
  },
  //单选框选择事件
  bindRadioBoxChange: function(obj) {
    var index = obj.currentTarget.dataset.index //表单项序号
    var valueList = this.data.form[index].valueList //可选项内容
    for (var valueIndex in valueList) {
      if (obj.detail.value == valueList[valueIndex]) {
        this.data.form[index].boxCache[valueIndex] = true
      } else {
        this.data.form[index].boxCache[valueIndex] = false
      }
    }
    this.data.form[index].defaultExpression = obj.detail.value

    //重新输入时，取消表单报错信息
    this.cancelIllegalError(obj)


    //计算打折
    if (this.data.formId == "chargeForm") {
      console.log("打折:" + this.data.chargeAmount)
      if (obj.detail.value == 0) {
        this.setData({
          ["form[1].defaultExpression"]: JSON.stringify(this.data.chargeAmount - 600)
        })
      } else if (obj.detail.value == 1) {
        this.setData({
          ["form[1].defaultExpression"]: JSON.stringify(this.data.chargeAmount - 800)
        })
      }
    }
  },

  //多选改单选
  bindCheckevaluationBoxChange: function(obj) {
    console.log(obj.detail)
    if (obj.detail.value.length>1){
      var index=0
      for (var valueIndex in obj.detail.value){
        index++
      }
      this.data.evaluation.content = obj.detail.value[--index]
      this.setData({
        evaluation: this.data.evaluation
      })
    }
    else if (obj.detail.value.length ==1){
      this.data.evaluation.content = obj.detail.value[0]
    }
    else{
      this.data.evaluation.content = 'EMPTY'
    }

    console.log(this.data.evaluation.content)
    //重新输入时，取消表单报错信息
    // this.cancelIllegalError(obj)
  },


  //多选框选择事件
  
  //多选框
  bindCheckBoxChange: function (obj) {
    var index = obj.currentTarget.dataset.index //表单项序号
    var valueList = this.data.form[index].valueList //可选项内容
    for (var valueIndex in valueList) {
      if (obj.detail.value.includes(valueList[valueIndex])) {
        this.data.form[index].boxCache[valueIndex] = true
      } else {
        this.data.form[index].boxCache[valueIndex] = false
      }
    }
    this.data.form[index].defaultExpression = obj.detail.value

    //重新输入时，取消表单报错信息
    this.cancelIllegalError(obj)
  },

  //普通下拉框选择事件
  bindPickerChange: function(obj) {
    var index = obj.currentTarget.dataset.index //表单项序号
    var pickerIndex = JSON.parse(obj.detail.value) //下拉框选择的序号
    var key = "form[" + index + "].boxCache"
    this.setData({
      [key]: pickerIndex
    })

    this.data.form[index].defaultExpression = this.data.form[index].valueList[obj.detail.value]
  },
  //日期选择器
  bindDateChange: function(obj) { //点击确定
    var index = obj.currentTarget.dataset.index //表单项序号

    var keyDateIndex = "form[" + index + "].boxCache.dateIndex"
    var keyDateIndexOrigin = "form[" + index + "].boxCache.dateIndexOrigin"
    this.setData({
      [keyDateIndex]: obj.detail.value,
      [keyDateIndexOrigin]: JSON.parse(JSON.stringify(obj.detail.value))
    })

    this.data.form[index].defaultExpression = this.data.form[index].boxCache.dateArr[0][this.data.form[index].boxCache.dateIndex[0]] + "-" +
      this.data.form[index].boxCache.dateArr[1][this.data.form[index].boxCache.dateIndex[1]] + "-" +
      this.data.form[index].boxCache.dateArr[2][this.data.form[index].boxCache.dateIndex[2]] + " 00:00:00" //+
    // this.data.form[index].boxCache.dateArr[3][this.data.form[index].boxCache.dateIndex[3]] + ":" +
    // this.data.form[index].boxCache.dateArr[4][this.data.form[index].boxCache.dateIndex[4]] + ":" +
    // this.data.form[index].boxCache.dateArr[5][this.data.form[index].boxCache.dateIndex[5]]
  },
  bindDateCancel: function(obj) { //点击取消
    var index = obj.currentTarget.dataset.index //表单项序号

    var keyDateIndex = "form[" + index + "].boxCache.dateIndex"
    this.setData({
      [keyDateIndex]: JSON.parse(JSON.stringify(this.data.form[index].boxCache.dateIndexOrigin))
    })
  },
  bindDateColumnChange: function(obj) { //滚动列时
    var index = obj.currentTarget.dataset.index //表单项序号
    var column = obj.detail.column //选择框滚动的列号
    var currentDateIndex = this.data.form[index].boxCache.dateIndex //当前显示日期的索引值

    currentDateIndex[column] = obj.detail.value
    //若年份或月份更换，每月天数也要替换
    if (column == 0 || column == 1) {
      var dayArr = datePicker.getMonthDay(this.data.form[index].boxCache.dateArr[0][currentDateIndex[0]],
        this.data.form[index].boxCache.dateArr[1][currentDateIndex[1]])
      if (currentDateIndex[2] >= dayArr[dayArr.length - 1]) //每月天数减小时，越界处理
      {
        currentDateIndex[2] = dayArr[dayArr.length - 1] - 1
        console.log(currentDateIndex[2])
      }

      var keyDateArr = "form[" + index + "].boxCache.dateArr[2]"
      var keyDateIndex = "form[" + index + "].boxCache.dateIndex"
      this.setData({
        [keyDateArr]: dayArr,
        [keyDateIndex]: currentDateIndex
      })
    } else {
      var keyDateIndex = "form[" + index + "].boxCache.dateIndex"
      this.setData({
        [keyDateIndex]: currentDateIndex
      })
    }
  },
  //显示图片全图
  previewImage: function(obj) {
    if (obj.currentTarget.dataset.index != null) { //表单
      wx.previewImage({
        current: obj.currentTarget.id, // 当前显示图片的http链接
        urls: this.data.form[obj.currentTarget.dataset.index].boxCache // 需要预览的全部图片http链接列表
      })
    } else { //项目反馈
      wx.previewImage({
        current: obj.currentTarget.id, // 当前显示图片的http链接
        urls: this.data.feedbackImages // 需要预览的全部图片http链接列表
      })
    }
  },
  //选择图片
  chooseImages: function(obj) {
    //限制图片的数量
    var maxNumber = 9
    if (obj.currentTarget.dataset.index != null) { //表单
      maxNumber = 9 - this.data.form[obj.currentTarget.dataset.index].boxCache.length
    } else { //项目反馈
      maxNumber = 9 - this.data.feedbackImages.length
    }
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
      success: function(res) {
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
        if (obj.currentTarget.dataset.index != null) { //表单
          var key = 'form[' + obj.currentTarget.dataset.index + '].boxCache'
          that.setData({
            [key]: that.data.form[obj.currentTarget.dataset.index].boxCache.concat(res.tempFilePaths)
          });
          //重新输入时，取消表单报错信息
          that.cancelIllegalError(obj)
        } else { //项目反馈
          that.setData({
            feedbackImages: that.data.feedbackImages.concat(res.tempFilePaths)
          });
        }
      }
    })
  },
  //删除图片
  deleteImage: function(obj) {
    if (obj.currentTarget.dataset.index != null) {
      this.data.form[obj.currentTarget.dataset.index].boxCache.splice(obj.currentTarget.dataset.imageindex, 1)
      var key = 'form[' + obj.currentTarget.dataset.index + '].boxCache'
      this.setData({
        [key]: this.data.form[obj.currentTarget.dataset.index].boxCache
      });
    } else {
      this.data.feedbackImages.splice(obj.currentTarget.dataset.imageindex, 1)
      this.setData({
        feedbackImages: this.data.feedbackImages
      });
    }
  },
  //进入子表单
  toChildFormPage: function(obj) {
    var index = obj.currentTarget.dataset.index //表单项序号
    //取消表单报错信息
    this.cancelIllegalError(obj)
    //跳转至子表单页面
    wx.navigateTo({
      url: "../form/form?processId=" + this.data.processId +
        "&processInstanceId=" + this.data.processInstanceId + "&isChild=true&taskId=" + this.data.taskId +
        "&formName=" + this.data.form[index].name + "&formId=" + this.data.form[index].propertyId
    })
  },

  //向后台请求提交表单文本
  requestSubmitForm: function(buttonId, submittedForm, formId) {
    var that = this

    var requestData = {
        "username": that.data.username,
        "processId": that.data.processId,
        "processInstanceId": that.data.processInstanceId,
        "taskId": that.data.taskId,
        "form": submittedForm
      },
      requestUrl //表单文本提交的数据和后台Url
    if (buttonId == "submit-button") { //正式提交的Url
      if (formId) { //提交子表单
        requestUrl = app.globalData.serverAddress + "/activity/api/subForm/submitTaskSubForm" //none
        requestData["formId"] = formId
      } else { //提交主表单
        requestUrl = app.globalData.serverAddress + "/activity/api/task/submitTask"
        if (this.data.taskId != "start") {
          requestData["evaluateType"] = this.data.evaluation.content
          requestData["reason"] = this.data.badReason.content
        }
      }
    } else { //保存表单的Url
      if (formId) { //保存子表单
        requestUrl = app.globalData.serverAddress + "/activity/api/subForm/submitTaskSubForm" //none
        requestData["formId"] = formId
      } else { //保存主表单
        // requestUrl = app.globalData.serverAddress + "/activity/api/task/saveForm" //none
        //保存本地缓存
        try {
          wx.setStorageSync(this.data.processId + this.data.processInstanceId + this.data.taskId, this.data.form)
          wx.setStorageSync(this.data.processId + this.data.processInstanceId + this.data.taskId + "evaluation", this.data.evaluation)
          wx.setStorageSync(this.data.processId + this.data.processInstanceId + this.data.taskId + "badReason", this.data.badReason)
          console.log(wx.getStorageSync(this.data.processId + this.data.processInstanceId + this.data.taskId))
          wx.showToast({
            title: "保存成功",
          })
          return
        } catch (e) {
          console.log(e)
          wx.showToast({
            title: e,
          })
          return
        }
      }
    }
    console.log(requestData, requestUrl)
    //提交表单其他文本数据
    wx.request({
      url: requestUrl,
      data: requestData,
      method: 'POST',
      header: {
        'content-type': 'application/json',
        "Authorization": "Bearer " + app.globalData.userInfo.access_token
      },
      success: function(res) {
        console.log(res)
        if (res.data.status == 0) { //表单文本数据提交成功
          if (buttonId == "submit-button") { //正式提交成功的提示信息
            if (!formId) { //只有主页面发起该请求提交数据时才显示提示并返回上一级页面,防止提交多个子表单时重复调用使得页面回退多次
              //提交成功后清除缓存
              wx.removeStorageSync(that.data.processId + that.data.processInstanceId + that.data.taskId)
              wx.removeStorageSync(that.data.processId + that.data.processInstanceId + that.data.taskId + "evaluation")
              wx.removeStorageSync(that.data.processId + that.data.processInstanceId + that.data.taskId + "badReason")
              wx.showToast({
                title: '提交成功'
              })
              //正式提交成功则退出页面
              setTimeout(function() {
                //返回上一级页面
                wx.navigateBack({
                  delta: 1
                })
              }, 1500)
            }
          } else { //保存成功的提示信息
            if (formId == that.data.formId) { //提示信息只显示一次(若没有此项，主页面点提交会显示两次提示信息)
              wx.showToast({
                title: '保存成功'
              })
            }
          }
        } else if (res.statusCode == 401) { //token无效则返回登录页面
          delete app.globalData.userInfo
          wx.removeStorageSync('userInfo')

          wx.showToast({
            title: "登录信息已失效",
            icon: 'none'
          })
          setTimeout(function() {
            //返回登录页面
            wx.redirectTo({
              url: "../login/login"
            })
          }, 1500)
        } else {
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
      fail: function(res) {
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
  //向后台请求上传图片
  requestUploadImage: function(imageUrlsList, currentImageNum, buttonId, submittedForm) {
    var that = this
    var formData = {
        "username": that.data.username,
        "processId": that.data.processId,
        "processInstanceId": that.data.processInstanceId,
        "taskId": that.data.taskId,
        "propertyId": imageUrlsList[imageUrlsList.length - currentImageNum].propertyId,
        "imageCount": imageUrlsList.length,
        "isFirst": imageUrlsList.length == currentImageNum
      },
      requestUrl = app.globalData.serverAddress + "/activity/api/task/uploadImage"
    if (this.data.isChild) {
      formData["formId"] = this.data.formId
      requestUrl = app.globalData.serverAddress + "/activity/api/subForm/uploadImage"
    }
    console.log(formData)
    wx.uploadFile({
      url: requestUrl,
      filePath: imageUrlsList[imageUrlsList.length - currentImageNum].image,
      name: 'file',
      formData: formData,
      method: 'POST',
      header: {
        "Content-Type": "multipart/form-data",
        'accept': 'application/json',
        "Authorization": "Bearer " + app.globalData.userInfo.access_token
      },
      success: function(res) {
        var data = JSON.parse(res.data) //wx.uploadFile返回的是字符串，需要转换为JSON格式
        console.log(res)
        if (data.status == 0) {
          //获取图片在服务器中存储的Url
          imageUrlsList[imageUrlsList.length - currentImageNum].image = app.globalData.serverAddress + "/activity" + data.url

          currentImageNum -= 1
          //若所有图片均已上传完毕，上传表单
          if (currentImageNum <= 0) {
            //将图片Url全部替换为服务器中存储的Url
            for (let imageUrl of imageUrlsList) {
              that.data.form[imageUrl.i].boxCache[imageUrl.j] = imageUrl.image
            }
            //更新submittedForm中的数据
            for (var i in that.data.form) {
              if (that.data.form[i].type == "IMAGE" && that.data.form[i].boxCache.length != 0) {
                submittedForm[that.data.form[i].propertyId] = { //提交图片的Url不需要https前缀
                  "content": that.data.form[i].boxCache.map(imageUrl => {
                    return imageUrl.replace(app.globalData.serverAddress + "/activity", "")
                  }),
                  "type": "IMAGE"
                }
                if (buttonId == "save-button") { //若是保存操作，需要更新页面显示层，将显示层图片的Url替换为其在后台的链接
                  var imageKey = "form[" + i + "].boxCache"
                  that.setData({
                    [imageKey]: that.data.form[i].boxCache
                  })
                }
              }
            }
            //提交表单其他文本数据
            that.requestSubmitForm(buttonId, submittedForm, that.data.formId)
          } else { //若未全部上传完毕，继续上传
            that.requestUploadImage(imageUrlsList, currentImageNum, buttonId, submittedForm)
          }
        } else if (res.statusCode == 401) { //token无效则返回登录页面
          delete app.globalData.userInfo
          wx.removeStorageSync('userInfo')

          wx.showToast({
            title: "登录信息已失效",
            icon: 'none'
          })
          setTimeout(function() {
            //返回登录页面
            wx.redirectTo({
              url: "../login/login"
            })
          }, 1500)
        } else {
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
      fail: function(res) {
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
  //合法性验证
  checkForm: function(form, obj) {
    for (var index in form) {
      if (form[index].type == "FORM") { //递归地验证子表单内容
        var res = this.checkForm(form[index].boxCache)
        if (res != "legal") {
          form[index].illegalError = true
          return form[index].name + "未填写完整!"
        }
      } else if (form[index].required && form[index].showable != false && form[index].writeable != false) { //检查必填项
        if (form[index].type == "IMAGE") { //检查图片项是否为空
          console.log(form[index].boxCache)
          console.log(form[index].boxCache.length)
          if (form[index].boxCache.length == 0) {
            form[index].illegalError = true
            return form[index].name + "未填写!"
          }
        } else { //检查其他必填项是否为空
          if (obj) { //主表单
            if (obj.detail.value[form[index].propertyId] == null || obj.detail.value[form[index].propertyId].length == 0) {
              form[index].illegalError = true
              return form[index].name + "未填写!"
            }
          } else { //子表单
            if (form[index].defaultExpression == null || form[index].defaultExpression.length == 0) {
              form[index].illegalError = true
              return form[index].name + "未填写!"
            }
          }
        }
      }
    }

    return "legal"
  },
  //提交表单
  submitForm: function(obj, childValue, formId) {
    const buttonId = obj.detail.target.id //触发事件的按钮ID
    var that = this
    console.log(obj)
    obj.detail.value

    if (buttonId == "submit-button") { //如果是正式提交,则需要检查必填项完整度
      //检查表单完整度
      var res = this.checkForm(this.data.form, obj)
      if (res != "legal") { //未填写完整则提示用户
        this.setData({
          form: this.data.form
        })
        wx.showToast({
          title: res,
          icon: "none"
        })
        return
      }
      if (this.data.taskId != "start") //检查评价项完整度
      {
        if (this.data.evaluation.content == null || this.data.evaluation.content.length == 0) { //检测是否已经评价上一岗工作情况
          this.setData({
            ["evaluation.illegalError"]: true
          })
          wx.showToast({
            title: "请填写对上一岗的评价!",
            icon: "none"
          })
          return
        }
        if (this.data.evaluation.content == "BAD" && (this.data.badReason.content == null || this.data.badReason.content.length == 0)) { //差评时必须填差评理由
          this.setData({
            ["badReason.illegalError"]: true
          })
          wx.showToast({
            title: "请填写差评理由!",
            icon: "none"
          })
          return
        }
      }
      //防止重复提交
      that.setData({
        hasSubmitted: true
      })
    }
    //显示提交中
    wx.showLoading({
      title: '正在提交'
    })

    //重塑form表单内容格式
    var submittedForm = {}
    if (childValue) { //若提交的是子表单内容
      for (var index in childValue) {
        var propertyId = childValue[index].propertyId //获取输入框ID
        var type = childValue[index].type //获取输入框类型
        var value = childValue[index].defaultExpression //获取输入框的值
        if (type == "IMAGE") { //在逻辑上，子表单数据已经在子页面时保存过，因此不需要重新上传，直接读取内容即可
          value = childValue[index].boxCache.map(imageUrl => {
            return imageUrl.replace(app.globalData.serverAddress + "/activity", "")
          })
        } else if (type == "FORM") { //递归地提交子表单的数据
          this.submitForm(obj, childValue[index].boxCache, childValue[index].propertyId)
        }

        submittedForm[propertyId] = {
          "content": value,
          "type": type
        }
      }
    } else { //若提交的是表单本身的内容
      for (var index in this.data.form) {
        var propertyId = this.data.form[index].propertyId //获取输入框ID
        var type = this.data.form[index].type //获取输入框类型
        //将picker组件的value值由下标替换为值
        if (type == "SELECT") {
          obj.detail.value[propertyId] = this.data.form[index].valueList[obj.detail.value[propertyId]]
        } else if (type == "DATE") {
          console.log(obj.detail.value[propertyId])
          obj.detail.value[propertyId] = this.data.form[index].boxCache.dateArr[0][this.data.form[index].boxCache.dateIndex[0]] + "-" +
            this.data.form[index].boxCache.dateArr[1][this.data.form[index].boxCache.dateIndex[1]] + "-" +
            this.data.form[index].boxCache.dateArr[2][this.data.form[index].boxCache.dateIndex[2]] + " 00:00:00" //+
          // this.data.form[index].boxCache.dateArr[3][this.data.form[index].boxCache.dateIndex[3]] + ":" +
          // this.data.form[index].boxCache.dateArr[4][this.data.form[index].boxCache.dateIndex[4]] + ":" +
          // this.data.form[index].boxCache.dateArr[5][this.data.form[index].boxCache.dateIndex[5]]
        } else if (type == "IMAGE") { //图片
          obj.detail.value[propertyId] = this.data.form[index].boxCache.map(imageUrl => {
            return imageUrl.replace(app.globalData.serverAddress + "/activity", "")
          })
        } else if (type == "FORM") { //递归地提交子表单的数据
          this.submitForm(obj, this.data.form[index].boxCache, this.data.form[index].propertyId)
        }

        submittedForm[propertyId] = {
          "content": obj.detail.value[propertyId],
          "type": type
        }
        //同步更新表单默认值数据(子页面的form是其父页面form的引用，该操作会同步更新父页面的form数据)
        this.data.form[index].defaultExpression = obj.detail.value[propertyId]
      }
    }
    console.log(submittedForm)

    //向后台请求提交数据
    //统计提交表单时需要上传的图片
    var imageUrlsList = []
    if (!childValue) {
      for (var index in this.data.form) {
        if (this.data.form[index].type == 'IMAGE') {
          //将图片加入上传列表中
          for (var j = 0; j < this.data.form[index].boxCache.length; j++) {
            if (!this.data.form[index].boxCache[j].includes(app.globalData.serverAddress)) { //已经上传的图片不再上传
              imageUrlsList.push({
                "image": this.data.form[index].boxCache[j],
                "propertyId": this.data.form[index].propertyId,
                "i": index, //i为表单项序号
                "j": j //j为该表单项的图片序号
              })
            }
          }
        }
      }
    }
    console.log(imageUrlsList.length)
    if (imageUrlsList.length == 0) { //若无图片上传，直接提交表单
      if (childValue) {
        this.requestSubmitForm(buttonId, submittedForm, formId)
      } else {
        this.requestSubmitForm(buttonId, submittedForm, this.data.formId)
      }
    } else {
      this.requestUploadImage(imageUrlsList, JSON.parse(JSON.stringify(imageUrlsList.length)), buttonId, submittedForm)
    }
  },

  //驳回表单(返回任务上一节点)
  refuseTask: function(obj) {
    wx.showLoading({
      title: "驳回中...",
    })
    //防止重复点击按钮
    this.setData({
      hasSubmitted: true
    })

    var that = this
    //请求驳回
    wx.request({
      url: app.globalData.serverAddress + "/activity/api/task/refuseTask",
      data: {
        "username": app.globalData.userInfo.username,
        "processId": that.data.processId,
        "processInstanceId": that.data.processInstanceId,
        "taskId": that.data.taskId
      },
      method: 'POST',
      header: {
        'content-type': 'application/json',
        "Authorization": "Bearer " + app.globalData.userInfo.access_token
      },
      success: function(res) {
        console.log(res)
        if (res.data.status == 0) { //提交成功
          //提交成功后清除缓存
          wx.removeStorageSync(that.data.processId + that.data.processInstanceId + that.data.taskId)
          wx.removeStorageSync(that.data.processId + that.data.processInstanceId + that.data.taskId + "evaluation")
          wx.removeStorageSync(that.data.processId + that.data.processInstanceId + that.data.taskId + "badReason")
          wx.showToast({
            title: '已驳回'
          })
          //正式提交成功则退出页面
          setTimeout(function() {
            //返回上一级页面
            wx.navigateBack({
              delta: 1
            })
          }, 1500)
        } else if (res.statusCode == 401) { //token无效则返回登录页面
          delete app.globalData.userInfo
          wx.removeStorageSync('userInfo')

          wx.showToast({
            title: "登录信息已失效",
            icon: 'none'
          })
          setTimeout(function() {
            //返回登录页面
            wx.redirectTo({
              url: "../login/login"
            })
          }, 1500)
        } else {
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
      fail: function(res) {
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

  //打开电子合同
  openElectronicContract: function(obj) {
    if (this.data.docxFilePath == null || this.data.docxFilePath.length == 0) {
      wx.showToast({
        title: "电子合同文件未下载!",
        icon: "none"
      })
      return
    }

    //防止重复点击
    this.setData({
      hasClickedOpen: true
    })
    var that = this
    //打开文件
    wx.openDocument({
      filePath: that.data.docxFilePath,
      fileType: "docx",
      success: function(res) {
        console.log("success")
        //打开成功后允许再次点击按钮
        that.setData({
          hasClickedOpen: false
        })
      },
      fail: function(res) {
        wx.showToast({
          title: "打开文件失败:" + res.errMsg,
          icon: "none"
        })
        //若打开失败，允许再次点击
        that.setData({
          hasClickedOpen: false
        })
      }
    })
  },
  //下载电子合同
  downloadElectronicContract: function(obj) {
    //下载中
    wx.showLoading({
      title: "下载中",
    })
    this.setData({
      hasClickedDownloaded: true
    })

    var requestUrl
    if (this.data.formId == "formalAgreementForm") {
      requestUrl = app.globalData.serverAddress + "/activity/api/contract/getDownloadContract?processInstanceId=" +
        this.data.processInstanceId + "&access_token=" + app.globalData.userInfo.access_token
    } else {
      requestUrl = app.globalData.serverAddress + "/activity/api/contract/getDownloadAgreement?processInstanceId=" +
        this.data.processInstanceId + "&access_token=" + app.globalData.userInfo.access_token
    }

    var that = this
    wx.request({
      url: requestUrl,
      data: {
        "processId": that.data.processId,
        "processInstanceId": that.data.processInstanceId,
        "formId": that.data.formId
      },
      method: "GET",
      success: function(res) {
        console.log(res)
        if (res.data.status == 0) {
          //下载文件
          wx.downloadFile({
            url: app.globalData.serverAddress + "/activity" + res.data.url,
            header: {
              "Authorization": "Bearer " + app.globalData.userInfo.access_token
            },
            success: function(res) {
              console.log(res)
              if (res.statusCode == 200) {
                that.setData({
                  docxFilePath: res.tempFilePath,
                  hasClickedDownloaded: false
                })
                wx.showToast({
                  title: "下载完成",
                })

                //下载完成后自动打开文件
                setTimeout(function() {
                  that.setData({ //下载成功后允许再次点击按钮
                    hasClickedDownloaded: false
                  })
                  that.openElectronicContract()
                }, 1500)
              } else if (res.statusCode == 401) { //token无效则返回登录页面
                delete app.globalData.userInfo
                wx.removeStorageSync('userInfo')

                wx.showToast({
                  title: "登录信息已失效",
                  icon: 'none'
                })
                setTimeout(function() {
                  //返回登录页面
                  wx.redirectTo({
                    url: "../login/login"
                  })
                }, 1500)
              } else {
                wx.showToast({
                  title: "下载失败:" + res.statusCode + ":" + res.errMsg,
                  icon: 'none'
                })
                //若下载失败，允许再次点击
                that.setData({
                  hasClickedDownloaded: false
                })
              }
            },
            fail: function(res) {
              wx.showToast({
                title: "下载失败:" + res.errMsg,
                icon: 'none'
              })
              //若下载失败，允许再次点击
              that.setData({
                hasClickedDownloaded: false
              })
            }
          })
        } else if (res.statusCode == 401) { //token无效则返回登录页面
          delete app.globalData.userInfo
          wx.removeStorageSync('userInfo')

          wx.showToast({
            title: "登录信息已失效",
            icon: 'none'
          })
          setTimeout(function() {
            //返回登录页面
            wx.redirectTo({
              url: "../login/login"
            })
          }, 1500)
        } else {
          wx.showToast({
            title: "获取下载路径失败:" + res.data.message,
            icon: 'none'
          })
          //若下载失败，允许再次点击
          that.setData({
            hasClickedDownloaded: false
          })
        }
      },
      fail: function(res) {
        wx.showToast({
          title: "获取下载路径失败:" + res.errMsg,
          icon: 'none'
        })
        //若下载失败，允许再次点击
        that.setData({
          hasClickedDownloaded: false
        })
      }
    })
  },

  //设置建议表的某项建议
  setSuggestionFormProperty: function(suggestionForm, propertyId, content) {
    for (let item of suggestionForm) {
      if (item.propertyId == propertyId) {
        item.defaultExpression = content
        if (item.type == "RADIO_BOX") { //单选框除了设置值，还要设置在页面中的勾选情况
          for (var valueIndex in item.valueList) {
            if (item.valueList[valueIndex] == content) {
              item.boxCache[valueIndex] = true
            } else {
              item.boxCache[valueIndex] = false
            }
          }
        }
      }
    }
  },
  //自动生成建议表
  generateSuggestionForm: function(surveyForm, suggestionForm) {
    for (let item of surveyForm) {
      switch (item.propertyId) {
        case "serialPortModel":
          { //电脑串口需转换器
            if (item.defaultExpression == "其他(需转换器)") {
              this.setSuggestionFormProperty(suggestionForm, "needConverter", "是")
              console.log("电脑串口需转换器")
            }
            break
          }
        case "usbCondition":
          { //建议修复或更换USB串口
            if (item.defaultExpression == "坏") {
              this.setSuggestionFormProperty(suggestionForm, "fixUSB", "是")
              console.log("建议修复或更换USB串口")
            }
            break
          }
        case "computerPerformance":
          { //电脑性能较低
            if (item.defaultExpression == "普通") {
              this.setSuggestionFormProperty(suggestionForm, "needHardDisk", "是")
              this.setSuggestionFormProperty(suggestionForm, "needMemoryBar", "是")
              this.setSuggestionFormProperty(suggestionForm, "restaurantName", "是")
              console.log("建议增加120G左右的固态硬盘")
              console.log("建议增加一个4G内存条")
              console.log("建议更换至少P3的CPU")
            }
            break
          }
        case "baseStaionNeedExtended":
          { //基站需要增加485延长信号源布网线
            if (item.defaultExpression == "是") {
              this.setSuggestionFormProperty(suggestionForm, "baseStaionNeedExtended", "是")
              console.log("基站需要增加485延长信号源布网线")
            }
            break
          }
        case "baseStaionNumber":
          { //需要基站(个)
            if (item.defaultExpression != null && item.defaultExpression.length != 0) {
              this.setSuggestionFormProperty(suggestionForm, "baseStaionNumber", item.defaultExpression)
              console.log("需要基站:" + item.defaultExpression + "个")
            }
            break
          }
        case "networkCondition":
        case "networkFullCoverage":
          { //需要完全覆盖的网络
            if (item.defaultExpression == "无网络" || item.defaultExpression == "否") {
              this.setSuggestionFormProperty(suggestionForm, "needNetwork", "是")
              console.log("需要完全覆盖的网络")
            }
            break
          }
        case "switchNumber":
          { //需要交换机(台)
            if (item.defaultExpression != null && item.defaultExpression.length != 0) {
              this.setSuggestionFormProperty(suggestionForm, "switchNumber", item.defaultExpression)
              console.log("需要交换机:" + item.defaultExpression + "台")
            }
            break
          }
        case "needNeedlePrinterNumber":
          { //需要针式打印机(台)
            if (item.defaultExpression != null && item.defaultExpression.length != 0) {
              this.setSuggestionFormProperty(suggestionForm, "needlePrinterNumber", item.defaultExpression)
              console.log("需要针式打印机:" + item.defaultExpression + "台")
            }
            break
          }
        case "installFloorOrderNumber":
          { //需要安装楼面落单机数量(台)
            if (item.defaultExpression != null && item.defaultExpression.length != 0) {
              this.setSuggestionFormProperty(suggestionForm, "floorOrderNumber", item.defaultExpression)
              console.log("需要安装楼面落单机数量:" + item.defaultExpression + "台")
            }
            break
          }
        case "installFloorPrinterNumber":
          { //需要安装楼面打印机数量(台)
            if (item.defaultExpression != null && item.defaultExpression.length != 0) {
              this.setSuggestionFormProperty(suggestionForm, "floorPrinterNumber", item.defaultExpression)
              console.log("需要安装楼面打印机数量:" + item.defaultExpression + "台")
            }
            break
          }
        case "installMobileOrder":
          { //需要装手机点单系统
            if (item.defaultExpression == "是") {
              this.setSuggestionFormProperty(suggestionForm, "installMobileOrder", "是")
              console.log("需要装手机点单系统")
            }
            break
          }
        case "installComputer":
          { //厨房需要单独装电脑
            if (item.defaultExpression == "是") {
              this.setSuggestionFormProperty(suggestionForm, "installKitchenComputer", "是")
              console.log("厨房需要单独装电脑")
            }
            break
          }
      }
    }
  },
  //自动生成收费价格评估
  generateChargeAmount: function(evaluationFormId, surveyFormId) {
    var evaluationForm = [], surveyForm = []
    //获取参照表单内容
    var that = this
    wx.request({
      url: app.globalData.serverAddress + '/activity/api/manager/getSubFormDetail',
      data: {
        "processId": that.data.processId,
        "processInstanceId": that.data.processInstanceId,
        "formId": evaluationFormId
      },
      method: 'POST',
      header: {
        'content-type': 'application/json',
        "Authorization": "Bearer " + app.globalData.userInfo.access_token
      },
      success: function (res) {
        console.log(res)
        if (res.data.status == 0) { //请求数据成功
          evaluationForm = res.data.subForm.properties

          //继续获取勘测表的数据
          wx.request({
            url: app.globalData.serverAddress + '/activity/api/manager/getSubFormDetail',
            data: {
              "processId": that.data.processId,
              "processInstanceId": that.data.processInstanceId,
              "formId": surveyFormId
            },
            method: 'POST',
            header: {
              'content-type': 'application/json',
              "Authorization": "Bearer " + app.globalData.userInfo.access_token
            },
            success: function (res) {
              console.log(res)
              if (res.data.status == 0) { //请求数据成功
                surveyForm = res.data.subForm.properties
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
                  messageTitle: "获取勘测表信息失败",
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
                messageTitle: "请求服务失败",
                messageDetails: res.errMsg
              })
              //页面加载完毕
              wx.hideLoading()
            }
          })
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
            messageTitle: "获取评估表信息失败",
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
          messageTitle: "请求服务失败",
          messageDetails: res.errMsg
        })
        //页面加载完毕
        wx.hideLoading()
      }
    })
    
    //生成收费标准
    var chargeAmount = 0
    var seatNum = 0 //餐位总数
    for (let item of evaluationForm) { //遍历评估表
      switch (item.name) {
        case "address": case "店面地址": case "地址": //地址类别
          {
            var address = item.value
            if (address == "城中") {
              chargeAmount += 100
            } else if (address == "城边") {
              chargeAmount += 200
            } else if (address == "郊区") {
              chargeAmount += 300
            }
            console.log(item.name + ":" + chargeAmount)
          }
        case "totalArea": case "总面积(平方米)": //营业面积
          {
            var totalArea = JSON.parse(item.value)
            if (totalArea < 700) {
              chargeAmount += 50
            } else if (totalArea >= 700 && totalArea < 1100) {
              chargeAmount += 100
            } else {
              chargeAmount += 150
            }
            console.log(item.name + ":" + chargeAmount)
          }
        case "seatNumber": case "tableNumber": case "散台数量": case "桌台总数": //统计餐位总数
          {
            if (item.value == null || item.value.length == 0) {
              seatNum += 0
            } else {
              seatNum += JSON.parse(item.value)
            }
            console.log(item.name + ":" + chargeAmount)
          }
        case "consumptionPrePerson": case "人均消费(元/人)": case "预期人均消费(元/人)": //人均消费
          {
            var consumptionPrePerson = JSON.parse(item.value)
            if (consumptionPrePerson < 90) {
              chargeAmount += 50
            } else if (consumptionPrePerson >= 90 && consumptionPrePerson < 130) {
              chargeAmount += 100
            } else {
              chargeAmount += 150
            }
            console.log(item.name + ":" + chargeAmount)
          }
      }
    }
    if (seatNum < 550) {  //根据餐位总数计算收费
      chargeAmount += 50
    } else if (seatNum >= 550 && seatNum < 950) {
      chargeAmount += 100
    } else {
      chargeAmount += 150
    }
    console.log("评估:" + chargeAmount)

    var terminalNum = 0   //终端机总数
    for (let item of surveyForm) { //遍历勘测表
      switch (item.name) {
        case "shelfTerminalNumber": case "wallTerminalNumber": case "tableTerminalNumber": case "货架上终端机数量(台)": case "墙面上终端机数量(台)": case "平摆桌面上终端机数量(台)": //统计终端机总数
          {
            if (item.value == null || item.value.length == 0) {
              terminalNum += 0
            } else {
              terminalNum += JSON.parse(item.value)
            }
            console.log(item.name + ":" + chargeAmount)
          }
        case "passerChefNumber": case "传菜员数量(名)":  //传菜员
          {
            var passerChefNumber = JSON.parse(item.value)

            chargeAmount += 50 + passerChefNumber * 50

            console.log(item.name + ":" + chargeAmount)
          }
      }
    }
    //根据终端机数量统计收费
    chargeAmount += terminalNum * 100
    console.log("最终:" + chargeAmount)

    //写入评估金额
    this.setData({
      chargeAmount: chargeAmount,
      ["form[1].defaultExpression"]: JSON.stringify(chargeAmount)
    })

    //加载完毕
    wx.hideLoading()
  },

  //修改表单数据格式并设置输入框数据缓存和合法性验证缓存
  readForm: function(form, subFormsNum) {
    for (let item of form) {
      item["illegalError"] = false //合法性验证缓存
      if (item.required == true && item.showable == false) { //主表单必填项强制设置为可写
        item.writeable = true
      }
      switch (item.type) {
        case "TEXT_AREA":
          { //文本域
            if (item.defaultExpression != null && item.defaultExpression != "") { //若有默认值或是之前保存过的数据则设置
              item["boxCache"] = item.defaultExpression.length
            } else {
              item["boxCache"] = 0
            }
            break
          }
        case "SELECT":
          { //下拉选择框
            if (item.defaultExpression != null && item.defaultExpression != "") { //若有默认值或是之前保存过的数据则设置
              item["boxCache"] = item.valueList.indexOf(item.defaultExpression)
            } else {
              item["boxCache"] = 0
              item.defaultExpression = item.valueList[0]
            }
            break
          }
        case "RADIO_BOX":
          { //单选框
            var radioChecked = []
            for (let value of item.valueList) {
              if (value == item.defaultExpression) {
                radioChecked.push(true)
              } else {
                radioChecked.push(false)
              }
            }
            item["boxCache"] = radioChecked

            break
          }
        case "CHECK_BOX":
          { //多选框
            var checkBoxChecked = []
            for (let value of item.valueList) {
              if (item.defaultExpression != null && item.defaultExpression != "") { //若有默认值或是之前保存过的数据则设置
                if (item.defaultExpression.includes(value)) {
                  checkBoxChecked.push(true)
                } else {
                  checkBoxChecked.push(false)
                }
              } else {
                checkBoxChecked.push(false)
              }
            }
            item["boxCache"] = checkBoxChecked
            break
          }
        case "IMAGE":
          { //图片选择框
            if (item.defaultExpression != null && item.defaultExpression != "") { //若有默认值或是之前保存过的数据则设置
              var images = []
              for (let imageUrl of item.defaultExpression.split(";")) {
                if (imageUrl.length != 0) {
                  images.push(app.globalData.serverAddress + "/activity" + imageUrl)
                }
              }
              item["boxCache"] = images
            } else {
              item["boxCache"] = []
            }
            break
          }
        case "DATE":
          { //日期选择框
            if (item.defaultExpression != null && item.defaultExpression != "") { //若有默认值或是之前保存过的数据则设置
              item["boxCache"] = datePicker.datePicker(2000, 2050, item.defaultExpression)
            } else {
              item["boxCache"] = datePicker.datePicker(2000, 2050)
              item.defaultExpression = item["boxCache"].dateArr[0][item["boxCache"].dateIndex[0]] + "-" +
                item["boxCache"].dateArr[1][item["boxCache"].dateIndex[1]] + "-" +
                item["boxCache"].dateArr[2][item["boxCache"].dateIndex[2]] + " 00:00:00" //+
              // item["boxCache"].dateArr[3][item["boxCache"].dateIndex[3]] + ":" +
              // item["boxCache"].dateArr[4][item["boxCache"].dateIndex[4]] + ":" +
              // item["boxCache"].dateArr[5][item["boxCache"].dateIndex[5]]
            }
            break
          }
        case "FORM":
          { //子表单
            var that = this
            //向后台请求获取子表单数据
            wx.request({
              url: app.globalData.serverAddress + '/activity/api/subForm/getTaskSubForm',
              data: {
                "processId": that.data.processId,
                "processInstanceId": that.data.processInstanceId,
                "taskId": that.data.taskId,
                "formId": item.propertyId
              },
              method: 'POST',
              header: {
                'content-type': 'application/json',
                "Authorization": "Bearer " + app.globalData.userInfo.access_token
              },
              success: function(res) {
                if (res.data.status == 0) { //请求数据成功
                  console.log(res)
                  subFormsNum -= 1
                  //读取返回的表单数据
                  item["boxCache"] = res.data.form.properties
                  //继续读取子表单数据
                  that.readForm(item["boxCache"], subFormsNum)

                  //页面加载完毕
                  if (subFormsNum <= 0) {
                    that.setData({
                      loadingCompleted: true,
                      loadingFormError: false
                    })
                    wx.hideLoading()
                  }
                } else if (res.statusCode == 401) { //token无效则返回登录页面
                  delete app.globalData.userInfo
                  wx.removeStorageSync('userInfo')

                  that.setData({
                    loadingFormError: true,
                    messageTitle: "操作失败",
                    messageDetails: "登录信息已失效"
                  })
                  //页面加载完毕
                  wx.hideLoading()
                  setTimeout(function() {
                    //返回登录页面
                    wx.redirectTo({
                      url: "../login/login"
                    })
                  }, 1500)
                } else {
                  that.setData({
                    loadingFormError: true,
                    messageTitle: "获取子表单信息失败",
                    messageDetails: res.data.message
                  })
                  //页面加载完毕
                  wx.hideLoading()
                }
              },
              fail: function(res) {
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
        default:
          {
            item["boxCache"] = []
            break
          }
      }
    }
  },

  //请求获取表单数据和项目进度信息
  requestGetForm: function() {
    var that = this
    //请求获取项目进度详情
    wx.request({
      url: app.globalData.serverAddress + "/activity/api/manager/getInstanceSchedule",
      data: {
        "processId": that.data.processId,
        "processInstanceId": that.data.processInstanceId
      },
      method: 'POST',
      header: {
        'content-type': 'application/json',
        "Authorization": "Bearer " + app.globalData.userInfo.access_token
      },
      success: function(res) {
        console.log(res)
        if (res.data.status == 0) {
          //整理并列分支，得到任务顺序序列
          var currentOrderNum = null
          for (var taskIndex in res.data.processInstance.tasks) {
            if (taskIndex != 0 && currentOrderNum != null && res.data.processInstance.tasks[taskIndex].orderNum == currentOrderNum) { //并列分支
              that.data.taskSequence[that.data.taskSequence.length - 1].push(JSON.parse(taskIndex))
            } else {
              that.data.taskSequence.push([JSON.parse(taskIndex)])
            }
            currentOrderNum = res.data.processInstance.tasks[taskIndex].orderNum
          }
          //设置数据
          that.setData({
            tasks: res.data.processInstance.tasks,
            taskSequence: that.data.taskSequence
          })
          console.log(that.data.taskSequence)
          console.log(that.data.tasks)

          //请求获取表单内容
          wx.request({
            url: app.globalData.serverAddress + '/activity/api/task/getForm',
            data: {
              "username": that.data.username,
              "processId": that.data.processId,
              "processInstanceId": that.data.processInstanceId
            },
            method: 'POST',
            header: {
              'content-type': 'application/json',
              "Authorization": "Bearer " + app.globalData.userInfo.access_token
            },
            success: function(res) {
              console.log(res)
              if (res.data.status == 0) {
                //读取返回数据
                that.setData({
                  taskId: res.data.taskId,
                  taskName: res.data.taskName,
                  loadingFormError: false,
                })
                //设置标题
                wx.setNavigationBarTitle({
                  title: that.data.taskName
                })

                //统计子表单数量
                var subFormsNum = 0
                for (let item of res.data.form) {
                  if (item.type == "FORM") {
                    subFormsNum += 1
                  }
                }
                //读取全部文本域、选择框、图片控件格式
                that.readForm(res.data.form, subFormsNum)
                //更新显示层数据
                that.setData({
                  form: res.data.form
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
              } else if (res.statusCode == 401) { //token无效则返回登录页面
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
                setTimeout(function() {
                  //返回登录页面
                  wx.redirectTo({
                    url: "../login/login"
                  })
                }, 1500)
              } else if (res.data.form == null) { //未轮到用户处理任务
                that.setData({
                  form: null,
                  loadingCompleted: true,
                  loadingFormError: false
                })
                //页面加载完毕
                wx.hideLoading()
              } else {
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
            fail: function(res) {
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
        } else if (res.statusCode == 401) { //token无效则返回登录页面
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
          setTimeout(function() {
            //返回登录页面
            wx.redirectTo({
              url: "../login/login"
            })
          }, 1500)
        } else {
          that.setData({
            loadingCompleted: true,
            loadingFormError: true,
            messageTitle: "无项目进度内容",
            messageDetails: res.data.message
          })
          //页面加载完毕
          wx.hideLoading()
        }
      },
      fail: function(res) {
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
  onLoad: function(options) {
    //页面加载中
    wx.showLoading({
      title: "加载中"
    })
    //获取页面参数和全局变量
    this.setData({
      username: app.globalData.userInfo.username,
      processId: options.processId,
      processInstanceId: options.processInstanceId,
      isChild: JSON.parse(options.isChild)
    })
    if (this.data.isChild == true) { //子表单需要额外的页面参数，且不再向后台请求数据
      var pages = getCurrentPages(); //获取页面栈
      var mainFormPage = pages[pages.length - 2]; //获取主表单页面
      //获取主表单数据的引用
      for (let item of mainFormPage.data.form) {
        if (item.propertyId == options.formId) {
          this.setData({
            form: item.boxCache,
            formId: options.formId,
            formName: options.formName,
            taskId: options.taskId,
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

      //判断表单是否为只读(只读表单隐藏保存按钮)
      for (let item of this.data.form) {
        if (item.writeable == true) {
          this.setData({
            readOnly: false
          })
          break
        }
      }
      //自动生成建议表
      if (this.data.formId == "SuggestionstoBusinessmenForm") {
        var surveyForm //勘测表
        //获取勘测表数据
        for (let item of mainFormPage.data.form) {
          if (item.propertyId.includes("SurveyForm")) {
            surveyForm = item.boxCache
            break
          }
        }

        if (surveyForm == null) {
          wx.showToast({
            title: "未找到勘测表数据,建议表不能自动生成!",
          })
        } else {
          //自动生成建议表
          this.generateSuggestionForm(surveyForm, this.data.form)
          this.setData({
            form: this.data.form
          })
          //页面加载完毕
          wx.hideLoading()
        }
      } else if (this.data.formId == "chargeForm") { //自动生成收费价格评估表
        var pages = getCurrentPages(); //获取页面栈
        var mainForm = pages[pages.length - 2].data.form; //获取主表单页面字段
        var evaluationFormId; //评估表ID
        var surveyFormNameId; //勘测表ID
        var isNew, installType
        for (let item of mainForm){
          if (item.propertyId == "isNew"){
            isNew = item.defaultExpression
          }
          if (item.propertyId == "installType"){
            installType = item.defaultExpression
          }
        }
        if (isNew == "是") { //新开店
          evaluationFormId = "newRestaurantEvaluationForm"
          surveyFormNameId = "newRestaurantCompleteSurveyForm"
        } else if (installType == "只安装厨房系统") { //老店厨房
          evaluationFormId = "restaurantEvaluationForm"
          surveyFormNameId = "kitchenSurveyForm"
        } else { //老店整套
          evaluationFormId = "restaurantEvaluationForm"
          surveyFormNameId = "completeSurveyForm"
        }
        //自动生成
        this.generateChargeAmount(evaluationFormId, surveyFormNameId)
      } else {
        //页面加载完毕
        wx.hideLoading()
      }

      return
    }

    //获取之前保存过的数据
    var form = wx.getStorageSync(this.data.processId + this.data.processInstanceId + this.data.taskId)
    var evaluation = wx.getStorageSync(this.data.processId + this.data.processInstanceId + this.data.taskId + "evaluation")
    var badReason = wx.getStorageSync(this.data.processId + this.data.processInstanceId + this.data.taskId + "badReason")
    if (evaluation != null && evaluation.length != 0) {
      this.setData({
        evaluation: evaluation
      })
    }
    if (badReason != null && badReason.length != 0) {
      this.setData({
        badReason: badReason
      })
    }
    if (form == null || form.length == 0) { //若无缓存数据，从服务器读取默认表单数据
      this.requestGetForm()
    } else {
      this.setData({
        form: form,
        loadingCompleted: true,
        loadingFormError: false
      })
      //页面加载完毕
      wx.hideLoading()
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {
    wx.stopPullDownRefresh()
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})