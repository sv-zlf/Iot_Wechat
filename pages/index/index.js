// pages/index/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },
  gotoMain:function() {
    wx.switchTab({
      url: '../k_control/index',
    })
  }
})