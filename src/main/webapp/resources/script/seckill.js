//模块化
var seckill = {
    //
    URL: {
        now: function(){
            return "/seckill/time/now";
        },
        exposer: function(seckillId){
            return "/seckill/" + seckillId + "/exposer";
        },
        excution: function(seckillId, md5){
            return "/seckill/" + seckillId + "/"  + md5 + "/excution";
        }
    },
    validatePhone: function(phone){
        if(phone && phone.length == 11 && !isNaN(phone)){
            return true;
        }else{
            return false;
        }
    },
    //秒杀逻辑
    detail: {
        init : function (params){
            //手机验证和登录，计时交互
            //在cookie中查找手机号
            var killPhone = $.cookie('killPhone');

            //验证手机号
            if(!seckill.validatePhone(killPhone)){
                //绑定手机
                //控制输出
                var killPhoneModal = $('#killPhoneModal');

                //显示弹出层
                killPhoneModal.modal({
                    show: true,
                    backdrop: 'static', //禁止位置关闭
                    keyboard: false //关闭键盘事件
                });

                $('#killPhoneBtn').click(function(){
                    var inputPhone = $('#killPhoneKey').val();
                    if(seckill.validatePhone(inputPhone)){
                        //电话写入cookie
                        $.cookie('killPhone', inputPhone, {expires: 7, path:'/seckill'});
                        //刷新
                        window.location.reload();
                    }else{
                        $('#killPhoneMessage').hide()
                            .html('<label class="label label-danger">手机号错误！</label>').show(300);
                    }
                });
            }

            //已经登陆
            //计时交互
            var startTime = params.startTime;
            var endTime = params.endTime;
            var seckillId = params.seckillId;
            $.get(seckill.URL.now(), {}, function(result){
                if(result && result.success){
                    var nowTime = result.data;
                    //时间判断
                    seckill.countdown(seckillId, nowTime, startTime, endTime);
                }else{
                    console.info("result:" + result);
                }

            })

        }
    },
    countdown: function(seckillId, nowTime, startTime, endTime){
        var seckillBox = $('#seckill-box');
        //时间判断
        if(nowTime > endTime){
            //秒杀结束
            seckillBox.html('秒杀结束！');
        }else if(nowTime < startTime){
            //秒杀未开始
            //计时事件绑定
            var killTime = new Date(startTime + 1000);
            seckillBox.countdown(killTime, function(event){
                var format = event.strftime("秒杀倒计时：%D天 %H时 %M分 %S秒");
                seckillBox.html(format);
            }).on('finish.countdown', function(){
                //获取秒杀地址
                seckill.handleSeckill(seckillId, seckillBox);
            });
        }else{
            //秒杀开始
            seckill.handleSeckill(seckillId, seckillBox);
        }
    },
    handleSeckill: function(seckillId, node){
        node.hide()
            .html('<button class="btn btn-primary btn-lg" id="killBtn">开始秒杀</button>');

        $.post(seckill.URL.exposer(seckillId), {}, function(result){
            //在回调函数中，执行交互流程
            if(result && result.success){
                var exposer = result.data;

                if(exposer.exposed){
                    //开启秒杀
                    //获取秒杀地址
                    var md5 = exposer.md5;
                    var killUrl = seckill.URL.excution(seckillId, md5);
                    //绑定一次点击事件
                    $('#killBtn').one('click', function(){
                        //执行秒杀请求
                        $(this).addClass('disabled');
                        //发送请求
                        $.post(killUrl, {}, function(result){
                            if(result && result.success){
                                var killResult = result.data;
                                var state = killResult.state;
                                var stateInfo = killResult.stateInfo;
                                //显示结果
                                node.html('<span class="label label-success">' + stateInfo + '</span>');
                            }
                        });
                    });

                    node.show();
                }else{
                    //未开启秒杀
                    var now = exposer.now;
                    var start = exposer.start;
                    var end = exposer.end;
                    //重新计算计时
                    seckill.countdown(seckillId, now, start, end);
                }
            }else{
                console.info("result: " + result);
            }
        });
    }
};