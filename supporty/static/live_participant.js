if (window.top === window.self) {
//    document.addEventListener('DOMContentLoaded', function () {
//    
//===============================================utility fuctions===============================================

    function g(e, f, m) {//selector , father , ismultipe
        if (!f) {
            f = document;
        }
        if (m) {
            return f.querySelectorAll(e);
        }
        return f.querySelector(e);
    }
    function toggleFullScreen() {
        if ((document.fullScreenElement !== undefined && document.fullScreenElement === null) ||
                (document.webkitIsFullScreen !== undefined && !document.webkitIsFullScreen)) {
            var elem = document.documentElement;
            if (elem.requestFullScreen) {
                elem.requestFullScreen();
            } else if (elem.webkitRequestFullScreen) {
                elem.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
            }
            return true;
        } else {
            if (document.cancelFullScreen) {
                document.cancelFullScreen();
            } else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen();
            }
            return false;
        }
    }
    function findClassByStartName(elem, startName) {
        var arr = elem.classList, i;
        for (var r = 0; r < arr.length; r++) {
            i = arr[r];
            if (i.startsWith(startName)) {
                return i;
            }
        }
        return null;
    }
    function b64EncodeUnicode(str) {
        try {
            return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (m, p) {
                return String.fromCharCode('0x' + p)
            }))
        } catch (e) {
            return null
        }
    }
    function b64DecodeUnicode(str) {
        try {
            return decodeURIComponent(atob(str).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            }).join(''))
        } catch (e) {
            return null
        }
    }
    function rc4(k, s) {
        var g = [], i, j = 0, x, r = '', l = 0400;
        for (i = 0; i < l; i++) {
            g[i] = i;
        }
        for (i = 0; i < l; i++) {
            j = (j + g[i] + k.charCodeAt(i % k.length)) % l;
            x = g[i];
            g[i] = g[j];
            g[j] = x;
        }
        i = 0;
        j = 0;
        for (var y = 0; y < s.length; y++) {
            i = (i + 1) % l;
            j = (j + g[i]) % l;
            x = g[i];
            g[i] = g[j];
            g[j] = x;
            r += String.fromCharCode(s.charCodeAt(y) ^ g[(g[i] + g[j]) % l]);
        }
        return r;
    }

    function removeHtml(e) {
        while (e.firstChild) {
            e.removeChild(e.firstChild);
        }
    }
    function removeChildren(ch, i) {
        if (typeof i === "number" && i > -1 && ch.length) {
            for (; i < ch.length; i++) {
                ch[i].remove();
            }
        }
    }
    function showAlert(title, body, closeTxt) {
        if (title) {
            dialogTitle.innerHTML = '<span class="dialog_title"><i class="fas fa-exclamation-triangle"></i> ' + title + '</span>';
        }
        if (body) {
            dialogBody.innerHTML = '<span>' + body + '</span>';
        }
        closeBt.textContent = closeTxt ? closeTxt : "متوجه شدم";
        modal.classList.remove(hide);
    }
    function runAfterDelay(func, time) {
        if (typeof func === "function") {
            setTimeout(function () {
                func();
            }, time ? time : 3000);
        }
    }

//===============================================general section===============================================

    var hide = "hide", mHide = "m_hide", modal = g("#modal_div"),
            CMD = Object.freeze({
//             [number,isenc]
                PUBLIC_MSG: [1, 0],
                PRIVATE_MSG: [2, 1],
                ACK_MSG: [3, 1],
                SHOW_MY_MSG: [4, 1],
                STATISTICS_REQUEST: [5, 1],
                STATISTICS_RESPONSE: [6, 1]
//                PUBLISH_CUSTOMER_MSG: [5, 0]
            }),
            USERTYPE = Object.freeze({
                SERVER: 1,
                SUPPORTER: 2,
                CUSTOMER: 3
            }),
            dialogTitle = g("#dialog_title"), dialogBody = g("#dialog_body"),
            dialogControl = g("#dialog_control"), message_input_js = g("#message"),
            textDiv = g("#text_div"),
            iframe = g("#iframe"), chatSub2 = g("#chat_sub2"), isChatShow = true,
            mobilePmBt = g("#mobile_pm_bt"), mobilePmTxt = g("span", mobilePmBt),
            mobilePmIcon = g("i", mobilePmBt), mobilePmQty = 0, chatDiv = g(".chat_div"),
            iframeDiv = g(".iframe_div"), lockAutoOpenOffers = false, likeBt = g("#liked_bt"),
            amICustomer = true, offerBt = g("#offer_bt"), offer = {}, msgLock = 0,
            msgLockTimeOut, dbServer, siteBaseUrl = "http://localhost:8383",
            closeBt = g("#close_bt"), myInfo, myMsgForAck,
            myName = "supporter123", currentParticipantName = "userid1234",
//*** for test in future when i write code of videoroom i must be get previousActiveParticipants when session of customer is created
            previousActiveParticipants = currentParticipantName,
//*** auth data extract from string query that maked in profile page when user request to join to live page
//
//n:username/id - t:user type (temporary, permanent, social),i:random string ID , p1&p2: random password,
            auth = {n: "username", t: 1, i: "random", p1: "password1", p2: "PASSWORD2"}, maxPmQty = 100;

    myInfo = {//videoroom janus address, room id, room token, room pin
        session1: "random_session1", session2: "random_session2", expiretime: 132141232, temporary_allowed: 1
        , id: "temporary/username1234", username: "user1236", usertype: 3, p1: "password1", p2: "PASSWORD2"
        , room: ["http://ubun.tu:8088/janus", 1234, "token12345", "pin12345", "displayname"]
        , stream: ["http://ubun.tu:8088/janus", 1234, "stream_pin_1", 1235, "stream_pin_2"]
                //server to communicate to karaver and viewers
        , server: "https://s1.supporty.com/live/", check: "random_string_to_check_encrypted_D_body"
    }

    message_input_js.focus();
    g(".modal_close_bt", 0, 1).forEach(function (i) {
        i.onclick = cleanModal;
    });
//modal.onclick = function (e) {
//    if (e.target === modal) {
//        cleanModal();
//    }
//}

    g("#close_live_bt").onclick = function () {
        dialogTitle.innerHTML = '<span class="dialog_title"><i class="fas fa-exclamation-triangle"></i> مطمئنی میخواهی لایو را خاتمه بدی ؟</span>';
        dialogControl.innerHTML = '<span id="close_live_page" class="button_ctr2 bg-css-red bt"><i class="fas fa-walking"></i> بله صفحه لایو را میبندم</span>';
        modal.classList.remove(hide);
        g("#close_live_page").onclick = function () {
            console.log("openProfile", new Date());
            //*** redirect current page to site supporty profile
            window.location = "/supporty_template_rtl/motherpage_home.html#profile_site";
        }
    }
    g("#close_customer_bt").onclick = function () {
        if (currentParticipantName) {
            dialogTitle.innerHTML = '<span class="dialog_title"><i class="fas fa-exclamation-triangle"></i> مطمئنی میخوای گفتگو با مخاطب تمام شود ؟</span>';
            dialogBody.innerHTML = '<span>نام مخاطب جاری : ' + currentParticipantName + '</span>';
            dialogControl.innerHTML = '<span id="close_customer_live" class="button_ctr2 bg-css-red bt"><i class="fas fa-walking"></i> بله گفتگو را میبندم</span>';
            modal.classList.remove(hide);
            g("#close_customer_live").onclick = function () {
//*** send request of kick off this custmer from videoroom
                console.log("current participants : " + currentParticipantName);
            }
        } else {
            toast.info("هیچ مخاطبی پیدا نشد");
        }
    }
    g("#min_max_bt").onclick = function () {
        var isFullScreen = toggleFullScreen();
        var e = g("i", this);
        if (isFullScreen) {
            e.classList.remove("fa-expand");
            e.classList.add("fa-compress");
        } else {
            e.classList.remove("fa-compress");
            e.classList.add("fa-expand");
        }
    }
    offerBt.onclick = function () {
        if (!msgLock && offer) {
            message_input_js.insertAdjacentHTML("beforeend", "<img src='" + offer.img + "' data-title='" + offer.title + "' data-link='" + offer.host + offer.path + "'>");
            setCursorToEnd(message_input_js);
        }
    }
    mobilePmBt.onclick = function () {
        if (isChatShow) {
            isChatShow = false;
            mobilePmIcon.classList.remove("fa-window-minimize");
            mobilePmIcon.classList.add("fa-window-maximize");
            chatSub2.classList.add(mHide);
            mobilePmTxt.classList.remove(hide);
            mobilePmTxt.textContent = mobilePmQty;
            chatDiv.classList.add("heigth_auto");
            iframeDiv.classList.remove(mHide);
        } else {
            isChatShow = true;
            mobilePmIcon.classList.remove("fa-window-maximize");
            mobilePmIcon.classList.add("fa-window-minimize");
            chatSub2.classList.remove(mHide);
            mobilePmTxt.classList.add(hide);
            chatDiv.classList.remove("heigth_auto");
            iframeDiv.classList.add(mHide);
        }
    }
    g("#private_bt").onclick = function () {
        if (checkMsgLock()) {
            var body = packMessage(1);
            if (body) {
                encapsulateMsg(CMD.PRIVATE_MSG, body);
            } else {
                toast.error("پیام شما ارسال نشد احتمالا هنوز چیزی ننوشتید یا متن پیام ساختار درستی ندارد");
            }
        }
    }







    window.addEventListener('message', function (e) {
        console.log("parent message received", e);
        console.log("parent message", "data: ", e.data, "origin: ", e.origin, e.data.hasOwnProperty("c"), e.data.c === "url", e.data.path);
        var f = 0;
        if (e.origin === window.location.origin && e.data.hasOwnProperty("c") &&
                e.data.c === "url" && e.data.isvalid) {
            f = 1;
            offer = e.data;
        }
        setOfferKeys(f);
    });
    db.open({
        server: 'supporty',
        version: 1,
        schema: {
            link: {key: {keyPath: 'hash'}},
            visit: {key: {keyPath: 'id', autoIncrement: true}},
            etc: {key: {keyPath: 'id'}}
        }
    }).then(function (s) {
        dbServer = s;
        isReadyForDiscussion = true;
    });
    function getVisitStatistics() {//callBack
//        if (callBack) {
        dbServer.link.query().all().execute().then(function (result) {
            var arr = [], len = 0;
            result.forEach(function (item) {
                dbServer.visit.query().filter('hash', item.hash).execute().then(function (value) {
                    var c = 0, d = 0;
                    value.forEach(function (i) {
                        c++;
                        d += i.duration;
                    })
                    if (c > 0) {
                        //[img src,title,count,duration,link]
                        arr.push([item.img, item.title, c, d, item.url]);
                    }
                    len++;
                    if (len >= result.length) {
//                            var obj = {arr: arr};
//                            callBack(arr);
                        encapsulateMsg(CMD.STATISTICS_RESPONSE, arr);
                    }
                })
            })
        })
//        }
    }
////*** just for test and show array members of getVisitStatistics() result
//    function showArr(arr) {
//        // [url,qty,duration]
//        if (typeof arr === "object")
//            arr = arr.data;
//        arr.forEach(function (item, idx) {
//            console.log(idx, item);
//        })
//    }
//    function visitedStatisticsResultCallback(res) {
//        if (typeof res === 'object') {
//            res = JSON.stringify(res);
//            res = b64EncodeUnicode(res);
//            var e = {c: CMD.VISITED_STATISTICS_RESULT, i: auth.i, s: USERTYPE.CUSTOMER, b: res};
//            encapsulateMsg(CMD.STATISTICS_RESPONSE,res);
//        }
//    }
    function getMsgFromBuffer(attrName, val, isRemovable) {
        var j;
        for (var f = 0; f < msgBuffer.length; f++) {
            j = msgBuffer[f];
            if (j[attrName] === val) {
                if (isRemovable) {
                    msgBuffer.splice(f, 1);
                }
                return j;
            }
        }
        return null;
    }
    function checkMsgLock() {
        if (!msgLock) {
            msgLockTimeOut = setTimeout(function () {
                clearMsgLock(1);
                toast.error("بعد از 7 ثانیه هنوز پیام به مخاطب نرسیده میخوای دوباره بفرست یا بررسی کن ببین ارتباط برقرار است یا نه");
            }, 7000);
            msgLock = 1;
            message_input_js.contentEditable = false;
            return true;
        } else {
            toast.info("پیام جاری ارسال شده لطفا کمی صبر کنيد")
        }
        return false;
    }
    function clearMsgLock(isNotText) {
        clearTimeout(msgLockTimeOut);
        msgLock = 0;
        message_input_js.contentEditable = true;
        if (!isNotText) {
            removeHtml(message_input_js);
        }
    }
    function cleanModal() {
        if (typeof scoreInterval !== 'undefined') {
            clearInterval(scoreInterval)
        }
        removeHtml(dialogBody);
        removeHtml(dialogControl);
        removeHtml(dialogTitle);
        closeBt.textContent = "فعلا نه";
        modal.classList.add(hide);
    }
    function setOfferKeys(isValid) {
        if (isValid) {
//            if (amICustomer) {
            likeBt.classList.remove(hide)
//            }
            offerBt.classList.remove(hide);
        } else {
            offer = null;
//            if (amICustomer) {
            likeBt.classList.add(hide)
//            }
            offerBt.classList.add(hide);
        }
    }
    function openOfferInIframe(e) {
        e = e.dataset.link;
        if (e && e.startsWith(siteBaseUrl)) {
            iframe.src = e;
        }
    }
    function packMessage() {
        var r = [], slice, isCorrectStructure = {flag: true};
        var txt = message_input_js.innerHTML.replace(/&nbsp;/gim, "").split("<br>");
        console.log("pack message txt : " + txt);
        for (var f = 0; f < txt.length; f++) {
            slice = txt[f].trim();
            if (slice.length < 1) {
                continue;
            }
            console.log("new Slice : " + slice);
            processPackSlice(r, slice, isCorrectStructure);
        }
        console.log(r, isCorrectStructure);
        if (r.length > 0 && isCorrectStructure.flag) {
            return r;
        }
        return null;
    }
    function processPackSlice(res, slice, isCorrectStructure) {
        var i1, i2;
        if (slice.includes("<img src=")) {
            var arr, flag, str, src, link, title, check;
            for (var d = 0; d < slice.length; d++) {
                arr = [];
                i1 = slice.indexOf("<img src=", d);
                i2 = slice.indexOf(">", i1);
//                        console.log("img   d: " + d, "i1: " + i1, "i2: " + i2);
                if (i1 > d) {
                    processPackSlice(res, slice.substring(d, i1).replace(/<br>/gim, ""), isCorrectStructure);
                }
                if (i1 < 0) {
                    processPackSlice(res, slice.substring(d, slice.length).replace(/<br>/gim, ""), isCorrectStructure);
                    d = slice.length;
                } else {
                    str = slice.substring(i1, i2 + 1);
                    flag = true;
                    var el = new DOMParser().parseFromString(str, 'text/html').body.firstChild;
//                    console.log('getCleanSlice str : ',str,new DOMParser().parseFromString(str, 'text/html').body.firstChild);
                    console.log("el : ", el, "typeof el : ", typeof el, 'el len; ', el.length, "str : " + str);
                    if (typeof el === 'object') {
                        src = el.src;
                        title = el.dataset.title;
                        link = el.dataset.link;
                        if (!link.startsWith(siteBaseUrl)) {
                            flag = false;
                            console.log("link : " + link)
                            toast.error("لینک پیشنهاد مربوط به این سایت نمیباشد");
                        }
                        check = isInputValidate(src);
                        if (!check) {
                            flag = false;
                            toast.error("عکس پیشنهاد ساختار درستی ندارد");
                        } else if (!check[0]) {
                            flag = false;
                            toast.error("در آدرس عکس پیشنهاد حروف غیر مجاز پیدا شده : " + check[1]);
                        }
                        check = isInputValidate(title);
                        if (!check) {
                            flag = false;
                            toast.error("عنوان پیشنهاد ساختار درستی ندارد");
                        } else if (!check[0]) {
                            flag = false;
                            toast.error("در متن عنوان پیشنهاد حروف غیر مجاز پیدا شده : " + check[1]);
                        }
                        check = isInputValidate(link);
                        if (!check) {
                            flag = false;
                            toast.error("لینک پیشنهاد ساختار درستی ندارد");
                        } else if (!check[0]) {
                            flag = false;
                            toast.error("در لینک پیشنهاد حروف غیر مجاز پیدا شده : " + check[1]);
                        }
                        if (flag) {
                            res.push(["offer", link, title, src]);
                        } else {
                            isCorrectStructure.flag = false;
                        }
                    } else {
                        isCorrectStructure.flag = false;
                        toast.error("پیشنهاد ساختار معتبری ندارد!");
                    }
                    d = i2;
                }
            }
        } else if (slice.includes("http")) {
            slice += "<br>";
            for (var d = 0; d < slice.length; d++) {
                i1 = slice.indexOf("http", d);
                i2 = slice.indexOf("<br>", i1);
                if (i1 > d) {
                    str = slice.substring(d, i1).replace(/<br>/gim, "");
                    console.log(str);
                    check = isInputValidate(str);
                    if (!check) {
                        isCorrectStructure.flag = false;
                        toast.error("جزییات ساختار درستی ندارد");
                    } else if (!check[0]) {
                        isCorrectStructure.flag = false;
                        toast.error("در جزییات حروف غیر مجاز پیدا شده : " + check[1]);
                    } else {
                        res.push(["span", str.replaceAll('\n', '').trim()]);
                    }
                }
                if (i1 < 0 || i2 < 1) {
                    continue;
                }
                str = slice.substring(i1, i2);
                check = isInputValidate(str);
                if (!check) {
                    isCorrectStructure.flag = false;
                    toast.error("لینک ارسالی ساختار درستی ندارد");
                } else if (!check[0]) {
                    isCorrectStructure.flag = false;
                    toast.error("در لینک ارسالی حروف غیر مجاز پیدا شده : " + check[1]);
                } else {
                    res.push(["a", str]);
                }
                d = i2 + 3;
            }
        } else {
            console.log("span    ", slice);
            str = slice;
            check = isInputValidate(str);
            if (!check) {
                isCorrectStructure.flag = false;
                toast.error("متن ارسالی ساختار درستی ندارد");
            } else if (!check[0]) {
                isCorrectStructure.flag = false;
                toast.error("در متن ارسالی حروف غیر مجاز پیدا شده : " + check[1]);
            } else {
                res.push(["span", str.replaceAll('\n', '').trim()]);
            }
        }
    }
    function unpackMessage(body) {
        var msgArr = [], check, flag = true;
        body.forEach(function (e) {
            if (e[0] === "span") {
                check = isInputValidate(e[1]);
                if (check == undefined) {
                    flag = false;
                    toast.error("پیام دریافت شده خالی است!");
                } else if (!check[0]) {
                    flag = false;
                    toast.error("در پیام دریافت شده حروف غیر مجاز پیدا شده : " + check[1]);
                } else {
                    msgArr.push(["span", e[1]]);
                }
            } else if (e[0] === "a") {
                check = isInputValidate(e[1]);
                if (check == undefined) {
                    flag = false;
                    toast.error("لینک دریافت شده خالی است!");
                } else if (!check[0]) {
                    flag = false;
                    toast.error("در لینک دریافت شده حروف غیر مجاز پیدا شده : " + check[1]);
                } else {
                    msgArr.push(["a", e[1]]);
                }
            } else if (e[0] === "offer") {
                if (!e[1].startsWith(siteBaseUrl)) {
                    flag = false;
                    toast.error("لینک دریافت شده مربوط به این سایت نمیباشد و دارای ریسک بیشتری است : " + e[1]);
                }
                check = isInputValidate(e[1]);
                if (!check) {
                    flag = false;
                    toast.error("لینک پیشنهاد ساختار درستی ندارد");
                } else if (!check[0]) {
                    flag = false;
                    toast.error("در لینک پیشنهاد دریافت شده حروف غیر مجاز پیدا شده : " + check[1]);
                }
                check = isInputValidate(e[2]);
                if (!check) {
                    flag = false;
                    toast.error("عنوان پیشنهاد ساختار درستی ندارد");
                } else if (!check[0]) {
                    flag = false;
                    toast.error("در عنوان پیشنهاد دریافت شده حروف غیر مجاز پیدا شده : " + check[1]);
                }
                check = isInputValidate(e[3]);
                if (!check) {
                    flag = false;
                    toast.error("لینک عکس پیشنهاد ساختار درستی ندارد");
                } else if (!check[0]) {
                    flag = false;
                    toast.error("در لینک عکس پیشنهاد دریافت شده حروف غیر مجاز پیدا شده : " + check[1]);
                }
                if (flag) {
                    msgArr.push(["offer", e[1], e[2], e[3]]);
                }
            } else {
                flag = false;
            }
        });
        return flag ? msgArr : null;
    }

    function processUnpackHtmlMessage(userType, body, customerMsgNum) {//, withoutFirstOffer
        var flag = true, firstOffer, isSupporterType = userType === USERTYPE.SUPPORTER;
        var h = '<div class="msg ' + (isSupporterType ? 'supporter"' : 'customer" data-id="' + customerMsgNum + '"') + '>' +
                '<div class="msg_header"><span class="name">' + (isSupporterType ? ' کارشناس مشاور ' : ' مشتری ') + '</span>' +
// *** customer side no need to have unblock bt so i remove it in future
//                (!isSupporterType && !amICustomer ?
//                        '<span class="button_ctr bg-css-darkblue" onclick="unlockPm(this)"><i class="fas fa-lock-open"></i> نمایش عمومی</span>' : '') +
                '</div>';
        body.forEach(function (e) {
            if (e[0] === "span") {
                h += '<span class="msg_txt">' + e[1] + '</span>';
            } else if (e[0] === "a") {
                h += '<a class="msg_link" href="' + e[1] + '" target="_blank"><i class="fas fa-external-link-alt"></i>' + e[1] + '</a>';
            } else if (e[0] === "offer") {//link, title, src
                if (!firstOffer) {
                    firstOffer = e[1];
                }
                h += '<div class="msg_offer" data-link="' + e[1] + '" onclick="openOfferInIframe(this)"><img src="' + e[3] + '"><span>' + e[2] + '</span></div>'
            } else {
                flag = false;
            }
        });
        h += '</div>';
        if (flag && body.length > 0) {
            textDiv.insertAdjacentHTML("afterbegin", h);
            if (firstOffer && isSupporterType && amICustomer && !lockAutoOpenOffers) {
                iframe.src = firstOffer;
            }
            removeChildren(g(".msg", textDiv, 1), maxPmQty);
            return true;
        }
        return false;
    }

    function sendDataChannelCallback(isSuccessful, data) {
        if (isSuccessful) {
            myMsgForAck = data;
        } else {
            toast.error("پیام ارسال نشد ارتباط با سرور را چک کنید")
        }
    }
    function encapsulateMsg(cmd, body, etc) {
        try {
            //*** implement DataChannel send function here
            if (cmd && body) {
                var j = {};
                j.cmd = cmd[0];
                j.sender = etc && etc.sender ? etc.sender : myInfo.username;
                j.usertype = etc && etc.usertype ? etc.usertype : myInfo.usertype;
                j.receiver = etc && etc.receiver ? etc.receiver : null;
                j.data = {ctr: "hi", body: body};
                if (cmd[1]) {
                    j.isenc = 1;
                    j.data = b64EncodeUnicode(rc4(myInfo.p2, rc4(myInfo.p1, JSON.stringify(j.data))));
                }
                console.log(encapsulateMsg.name, "encrypted : ", j);
                j = JSON.stringify(j);
                sendDataChannel(j, sendDataChannelCallback);
            }
        } catch (e) {
            console.error("error in message capsulation", e);
        }
        //*** it's need a "if(condition)" about DataChannel socket is closed and message not trasfered, so must be clear timeOut on message button
    }

    function decapsulateMsg(j) {
//*** implement DataChannel receive function here
        try {
            j = JSON.parse(j);
            if (j.cmd && j.data && j.sender) {
                console.log(decapsulateMsg.name, "encrypted : ", j);
                if (!j.receiver || j.receiver === info.session2) {
                    if (j.isenc) {
                        j.data = JSON.parse(rc4(myInfo.p1, rc4(myInfo.p2, b64DecodeUnicode(j.data))));
                    }
                    if (j.data.ctr === "hi") {
                        console.log(decapsulateMsg.name, "decrypted : ", j);

                        switch (j.cmd) {
                            case CMD.PUBLIC_MSG[0]:
                            case CMD.PRIVATE_MSG[0]:
                                writeMsgToChatList(j);
//                                var body = unpackMessage(j.data.body);
//                                if (body) {
//                                    var flag = processUnpackHtmlMessage(j.usertype, body);
//                                    if (flag) {
//                                        encapsulateMsg(CMD.ACK_MSG, "OK");
//                                    } else {
//                                        toast.error("پیام دریافت شد اما ساختار مشکوکی دارد ما برای امنیت شما جلوی نمایش آنرا میگیریم");
//                                    }
//                                } else {
//                                    toast.error("ساختار پیام فرستنده استاندارد نبود و قابل نمایش نیست");
//                                }
                                break;
                            case CMD.ACK_MSG[0]:
                                myMsgForAck = JSON.parse(myMsgForAck);
                                myMsgForAck.cmd = CMD.SHOW_MY_MSG[0];
                                myMsgForAck = JSON.stringify(myMsgForAck);
                                decapsulateMsg(myMsgForAck);
                                break;
                            case CMD.SHOW_MY_MSG[0]:
                                //*** if message was successful sent or ack message received then call clearMsgLock()
                                writeMsgToChatList(j, 1);
                                clearMsgLock();
                                break;
                            case CMD.STATISTICS_REQUEST[0]:
                                if (j.data.body[0] === "list") {
                                    getVisitStatistics();
                                }
                                break;
                        }
                    }
                }
            }
        } catch (e) {
            console.error("error in message decapsulation", e);
        }
    }

    function writeMsgToChatList(j, isMyOwn) {
        console.log("DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD  ", isMyOwn, j, typeof j);
        var body = unpackMessage(j.data.body);
        if (body) {
            var flag = processUnpackHtmlMessage(j.usertype, body);
            if (flag) {
                if (!isMyOwn) {
                    encapsulateMsg(CMD.ACK_MSG, "OK");
                }
            } else {
                toast.error("پیام دریافت شد اما ساختار مشکوکی دارد ما برای امنیت شما جلوی نمایش آنرا میگیریم");
            }
        } else {
            toast.error("ساختار پیام فرستنده استاندارد نبود و قابل نمایش نیست");
        }
    }

//===============================================customer section===============================================

//    if (isCustomer) {

    g("#add_remove_request_bt").onclick = function () {
        if (isReadyForDiscussion) {
            toast.info("اگر قبلا از ایتم های سایت دیدن کرده باشید درخواست گفتگو نمایان خواهد شد ممکن است بررسی چند لحظه طول بکشد");
            getVisitStatistics(addDiscussionRequest);
        } else {
            toast.info("لطفا چند ثانیه بعد دوباره امتحان کنید");
        }
    }
    function addDiscussionRequest(obj) {
        dialogTitle.innerHTML = '<span class="dialog_title"><i class="fas fa-exclamation-triangle"></i> درخواست گفتگو لایو :</span>';
        dialogControl.innerHTML = '<span id="join_live_bt" class="button_ctr2 bg-css-darkgreen bt"><i class="fas fa-check-circle"></i> میخواهم درخواستم را ارسال کنم</span>';
        modal.classList.remove(hide);
        var c = 0, d = 0;
        console.log("obj:", obj, "obj.data :", obj.data);
        if (typeof obj === "object") {
            obj = obj.data;
            obj.forEach(function (i) {
                if (i.length === 6) {
                    c += i[2];
                    d += i[3];
                }
            });
            g("#join_live_bt").onclick = function () {
                if (c > 0 && d > 0) {
                    console.log("join live bt clicked with data : ", {username: auth.n, usertype: auth.t, cout: c, duration: d});
                    //*** send discussion request to supporty server {username: auth.n, usertype: auth.t, cout: c, duration: d}
                    // $.post(/supporty/discussion_request {username: auth.n, usertype: auth.t, cout: c, duration: d} )
                } else {
                    toast.info("بازدید شما از صفحات سایت کافی نیست لطفا قدری سایت را مشاهده کنید و با محصولات آن آشنا شوید");
                }
            }
        }
    }
    g("#lock_bt").onclick = function () {
        var e = g("i", this), s = g("span", this);
        if (lockAutoOpenOffers) {
            lockAutoOpenOffers = false;
            s.textContent = "قفل";
            e.classList.remove("fa-lock-open");
            e.classList.add("fa-lock");
            toast.info("منو آزاد شد");
        } else {
            lockAutoOpenOffers = true;
            s.textContent = "آزاد";
            e.classList.remove("fa-lock");
            e.classList.add("fa-lock-open");
            toast.info("منو قفل شد");
        }
    }
    likeBt.onclick = function () {
        console.log("s61ecc clicked");
        //*** change target url
        if (offer) {
            var b64 = b64EncodeUnicode('{"link":"' + offer.host + offer.path +
                    '","hash":' + offer.hash + ',"title":"' + offer.title + '","img":"' + offer.img + '","numid":' + offer.numid + '}');
            console.log("b64: ", b64, "\r\n", '{"link":"' + offer.host + offer.path +
                    '","hash":' + offer.hash + ',"title":"' + offer.title + '","img":"' + offer.img + '","numid":' + offer.numid + '}');
            window.open('http://localhost:8383/supporty_template_rtl/motherpage_home.html?p=' + b64 + '#external_favorite',
                    'addfav', 'height=600,width=500,status=no,menubar=no,toolbar=no');
        }
    }
//    }

//    });
} else {
    document.querySelector("html").innerHTML = "";
}
