//格式化时间数据，如1月显示为01
function formatDate(date){
  return date < 10 ? '0' + date : '' + date;
}
//获取从start到end的列表数组
function getLoopArray(start, end) {
  var start = start || 0;
  var end = end || 1;
  var array = [];
  for (var i = start; i <= end; i++) {
    array.push(formatDate(i));
  }

  return array;
}
//获取一个月的天数
function getMonthDay(year, month) {
  //判断是否为闰年
  var isLeapYear = year % 400 == 0 || (year % 4 == 0 && year % 100 != 0), array = null;

  switch (month) {
    case '01':
    case '03':
    case '05':
    case '07':
    case '08':
    case '10':
    case '12':
      array = getLoopArray(1, 31)
      break;
    case '04':
    case '06':
    case '09':
    case '11':
      array = getLoopArray(1, 30)
      break;
    case '02':
      array = isLeapYear ? getLoopArray(1, 29) : getLoopArray(1, 28)
      break;
    default:
      array = '月份格式不正确，请重新输入！'
  }

  return array;
}
//默认时间缺省时，设置为当前时间
function getCurrentDate() {
  //获取当前时间
  var newDate = new Date();

  var year = formatDate(newDate.getFullYear()),
    mont = formatDate(newDate.getMonth() + 1),
    date = formatDate(newDate.getDate()),
    hour = formatDate(newDate.getHours()),
    minu = formatDate(newDate.getMinutes()),
    seco = formatDate(newDate.getSeconds());

  return [year, mont, date, hour, minu, seco];
}

//获取日期选择器的数据
function datePicker(startYear, endYear, date) {
  // 返回默认显示的数组和联动数组的声明
  var dateArr = [[], [], []]//, [], [], []];
  var start = startYear || 1970;
  var end = endYear || 2100;
  // 默认选择的时间，若无指定则使用当前时间
  var defaultDate = date ? [...date.split(' ')[0].split('-'), ...date.split(' ')[1].split(':')] : getCurrentDate();
  // 处理得到供选择框显示的日期数组
  dateArr[0] = getLoopArray(start, end);
  dateArr[1] = getLoopArray(1, 12);
  dateArr[2] = getMonthDay(defaultDate[0], defaultDate[1]); //每个月的天数需要单独判断
  // dateArr[3] = getLoopArray(0, 23);
  // dateArr[4] = getLoopArray(0, 59);
  // dateArr[5] = getLoopArray(0, 59);


  // 当前日期在日期列表中的下标
  var dateIndex = []
  dateArr.forEach((current, index) => {
    dateIndex.push(current.indexOf(defaultDate[index]));
  });

  return {
    dateArr: dateArr,
    dateIndex: dateIndex,
    dateIndexOrigin: JSON.parse(JSON.stringify(dateIndex))
  }
}

module.exports = {
  datePicker: datePicker,
  getMonthDay: getMonthDay,
  formatDate: formatDate
}