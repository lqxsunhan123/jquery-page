/**
 * @author sunh
 * @date 2018-07-27
 * @desc 分页小插件,获取数据后的操作由用户自定义,该插件只提供pagination的自动生成
 * @option
 *
 */

/*// 用法
var pageObj = $("xx").page({
    url: '', // 后台接口地址
    data: {}, // 第一次请求时需要携带的参数
    getRes: function(r){},//用户自定义处理数据方法
    pageSize: 10,// 每页显示的记录数
    pageNo: 1,// 页码
    mapping: null// 该插件要求后台返回的数据包括  currentPage  pageSize  total   如果用户的数据结构不是这样的,可以通过此属性配置映射关系
}) // 此初始化返回一个page对象,调用该page对象可以刷新数据,携带查询参数,更改url地址和处理数据的方法

pageObj.reload({
        url: 'xx',   // 在reload的配置中传入url,则分页器会以这个新的url来请求后台
        name: 'xx',// 一些用户自定义的参数
        age: 'xx'
    }, function(data){
        // 这个作为reload方法的第二个参数是个函数,若有此参数,则分页器会以这个方法作为处理数据的方法
    })*/
(function ($) {
    /**
     * 分页对象
     * @param ops    配置信息  包括pageNo  pageSize 查询参数等
     * @param domObj 容器,即用于存放页面数据
     * @constructor
     */
    function PageObj(ops, domObj){

        // 记录下dom信息以便后期调用
        var _this = domObj;

        // 请求数据的方法,内部方法,外部不可见
        function fetchData(pageSize, pageNo){
            var data = Object.assign(ops.data, {pageSize, pageNo});
            // 用户是否在参数中传递了url参数，若传递了则重载在插件配置里的url
            var url = ops.data.url == null ? ops.url : ops.data.url;
            console.log(data);
            $.ajax({
                url : url,
                type : "POST",
                dataType : "json",
                data : data,
                success : (data) => {
                    // 先根据数据执行用户的自定义方法
                    ops.getRes(data);
                    // 返回数据中必须包含total pageSize currentPage
                    // 读取用户配置的mapping信息
                    var {total, pageSize, currentPage} = data;
                    if(ops.mapping != null){
                        var userOps = ops.mapping(data);
                        total = userOps.total;
                        pageSize = userOps.pageSize;
                        currentPage = userOps.currentPage;
                    }
                    // 总页数
                    var totalPage = Math.ceil(total / pageSize);

                    var htmlStr = "";
                    /**
                     * 1. 页数小于等于3
                     *     直接出n个页码
                     * 2. 页数大于3
                     *     出上一页  下一页
                     *     页码为最后一页时,  now-page在第二个方块
                     */
                    if(totalPage <= 3){
                        // 生成页码个数的分页块
                        for(var i = 1; i <= totalPage; i++){
                            // 当前页码添加样式
                            var className = currentPage == i ? "now-page" : "";
                            htmlStr+="<a href=\"javascript:;\" class=\"" + className + "\">" + i + "</a>";
                        }
                        // 追加内容到容器
                        $(_this).html(htmlStr);
                        // 页码添加点击事件
                        $(".pages a").click((e) => {
                                // 点击跳转到目标页码
                                var pageNo = $(e.target).html();
                                fetchData(pageSize, pageNo);
                        })
                    } else {
                        if(currentPage != totalPage){
                            htmlStr+="<a href=\"javascript:;\"  class=\"pre-page\" data-page='" + (currentPage - 1) + "'>上一页</a>"+
                                "<a href=\"javascript:;\"  class=\"now-page\" data-page='" + currentPage + "'>" + currentPage + "</a>"+
                                "<a href=\"javascript:;\" data-page='" + (currentPage + 1) + "'>"+ (currentPage + 1) +"</a>"+
                                "<a href=\"javascript:;\" data-page='" + (currentPage + 1) + "' class=\"next-page\">下一页</a>"+
                                "<span>共"+ totalPage +" 页,到第</span>"+
                                "<input class=\"pages-in\"  id=\"searchInput\" type=\"number\"/>"+
                                "<span>页</span>"+
                                "<button class=\"confirm-btn\">确定</button>";
                        } else {
                            htmlStr+="<a href=\"javascript:;\"  class=\"pre-page\" data-page='" + (currentPage - 1) + "'>上一页</a>"+
                                "<a href=\"javascript:;\"   data-page='" + (currentPage - 1) + "'>" + (currentPage - 1) + "</a>"+
                                "<a href=\"javascript:;\" class=\"now-page\" data-page='" + (currentPage) + "'>"+ currentPage +"</a>"+
                                "<a href=\"javascript:;\" data-page='" + (currentPage + 1) + "' class=\"next-page\">下一页</a>"+
                                "<span>共"+ totalPage +" 页,到第</span>"+
                                "<input class=\"pages-in\"  id=\"searchInput\" type=\"number\"/>"+
                                "<span>页</span>"+
                                "<button class=\"confirm-btn\">确定</button>";
                        }
                        // 追加内容到容器
                        $(_this).html(htmlStr);
                        $(".pages a").click((e) => {
                            // 获取页码
                            var pageNo = $(e.target).attr("data-page");
                            // 请求的前提是 1.点击的不是当前页  2.当前页不是第一页  3.当前页不是最后一页
                            if (pageNo != currentPage && pageNo != 0 && pageNo != (totalPage + 1)) {
                                fetchData(pageSize, pageNo);
                            }
                        })
                        $(".pages button").click((e) => {
                            var pageNo = $(e.target).prev().prev().val();
                            fetchData(pageSize, pageNo);
                        })
                    }
                },
                error : function(){
                    console.log("加载出错...");
                }
            });
        }

        // 实例化后默认请求一次数据
        fetchData(ops.pageSize, ops.pageNo)

        /**
         * 重新请求数据方法  如需条件筛选 则传入json参数 可以重新配置数据源的获取url
         * @param param
         */
        this.reload = function(param, getRes){
            // 将参数加入option
            ops.data = param;

            // 如果用户传入了变更数据的方法,则使用用户的
            if(getRes != null){
                ops.getRes = getRes;
            }
            fetchData(ops.pageSize, 1);
        }

    }
    $.fn.page = function(options) {
        var dft = {
            //以下为该插件的属性及其默认值
            url: '', // 后台接口地址
            data: {}, // 请求参数
            getRes: function(r){},//用户自定义方法
            pageSize: 10,// 每页显示的记录数
            pageNo: 1,// 页码
            mapping: null// 该插件要求后台返回的数据包括  currentPage  pageSize  total   如果用户的数据结构不是这样的,可以通过此属性配置映射关系
            /**
             * mapping: function(data){
             *    // data为服务器返回的数据
             *    return {
             *       total: data.count,
             *       pageSize: data.pageSize,
             *       currentPage: data.pageNo
             *    }
             *   }
             */
        };
        var ops = $.extend(dft,options);
        // 记录下dom信息以便后期调用
        var _this = this;
        $(this).prop("class", "pages");
        var obj = new PageObj(ops, _this);
        // obj.fetchData(pageSize, pageNo);
        return obj;
    }
})(jQuery);