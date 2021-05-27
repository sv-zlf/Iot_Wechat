//index.js
//获取应用实例
var mqtt = require('../../utils/mqtt.min.js') //根据自己存放的路径修改
const crypto = require('../../utils/hex_hmac_sha1.js'); 
const deviceConfig = {
  productKey: "**********",
  deviceName: "************",
  deviceSecret: "**********",
  regionId: "cn-shanghai"
};
var subTopic='/sys/'+`${deviceConfig.productKey}`+'/'+`${deviceConfig.deviceName}`+'/thing/service/property/set'
var pubTopic='/sys/'+`${deviceConfig.productKey}`+'/'+`${deviceConfig.deviceName}`+'/thing/event/property/post'
var client;

Page({
  data: {
    humidity: "",
    temperature:"",
    imageUrl:"../../images/down.png",
    productKey: deviceConfig.productKey,
    deviceName:deviceConfig.deviceName,
    deviceSecret:deviceConfig.deviceSecret,
    switch_light:"0"
  },
    // 设备身份三元组输入框事件处理函数
    productKeyInput: function (e) {
      deviceConfig.productKey = e.detail.value
      this.setData({productKey: deviceConfig.productKey})
    },
    deviceNameInput: function (e) {
      deviceConfig.deviceName = e.detail.value
      this.setData({deviceName:deviceConfig.deviceName})
    },
    deviceSecretInput: function (e) {
      deviceConfig.deviceSecret= e.detail.value
      this.setData({deviceSecret:deviceConfig.deviceSecret})
    },
  //发布信息，开灯
  turnon:function () {
    const payloadJson = {
      id: Date.now(),
      params: {
          "LightSwitch": "1"
      },
      method: "thing.event.property.post"
    }
    this.setData({
      imageUrl:'../../images/up.png'
    })
    client.publish(pubTopic,JSON.stringify(payloadJson))
  },
  //发布信息，关灯
  turnoff:function () {
    const payloadJson = {
      id: Date.now(),
      params: {
          "LightSwitch": "0"
      },
      method: "thing.event.property.post"
    }
    this.setData({
      imageUrl:'../../images/down.png'
    })
    client.publish(pubTopic,JSON.stringify(payloadJson))
  },
  online:function(){
    var that=this
    const options = this.initMqttOptions(deviceConfig);
    console.log(options)
    client = mqtt.connect('wxs://'+`${deviceConfig.productKey}`+'.iot-as-mqtt.cn-shanghai.aliyuncs.com',options)
    client.on('connect', function () {
      console.log('连接服务器成功')
      //订阅主题(这里的主题可能会不一样，具体请查看后台设备Topic列表或使用自定义主题)
      client.subscribe(subTopic, function (err) {
        if (!err) {
           console.log('订阅成功！');
        }
      })
    })
	//接收消息监听
    client.on('message', function (subTopic, message) {
       var messages=message.toString()
       message=JSON.parse(messages) //将接收到的字符串进行Json格式转换
       console.log(message)
       that.setData({message:messages})
       //通过获取的温湿度来设置显示在小程序上
       //依据不同的数据解析方式

      //  that.setData({
      //   temperature:message['items']['temp']['value'],
      //   humidity:message['items']['hum']['value']
      // })

    })
  },
  offline:function(){
    //client连接断开,关闭连接
setTimeout((function callback() {
   client.end();
}).bind(this), 100);
    this.setData({
      humidity: "",
      temperature:"",
    })
    console.log('设备断开连接')
  },
  //IoT平台mqtt连接参数初始化
 initMqttOptions(deviceConfig) {

    const params = {
      productKey: deviceConfig.productKey,
      deviceName: deviceConfig.deviceName,
      timestamp: Date.now(),
      clientId: Math.random().toString(36).substr(2),
    }
    //CONNECT参数
    const options = {
      keepalive: 60, //60s
      clean: true, //cleanSession不保持持久会话
      protocolVersion: 4 //MQTT v3.1.1
    }
    //1.生成clientId，username，password
    options.password = this.signHmacSha1(params, deviceConfig.deviceSecret);
    options.clientId = `${params.clientId}|securemode=2,signmethod=hmacsha1,timestamp=${params.timestamp}|`;
    options.username = `${params.deviceName}&${params.productKey}`;

    return options;
  },

/*
  生成基于HmacSha1的password
  参考文档：https://help.aliyun.com/document_detail/73742.html?#h2-url-1
*/
 signHmacSha1(params, deviceSecret) {

    let keys = Object.keys(params).sort();
    // 按字典序排序
    keys = keys.sort();
    const list = [];
    keys.map((key) => {
      list.push(`${key}${params[key]}`);
    });
    const contentStr = list.join('');
    return crypto.hex_hmac_sha1(deviceSecret, contentStr);
  }
})
