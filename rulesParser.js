$(document).ready(function(){
    var debugX=0;
    var rules = null;
    var errorCount = 0;
    var loaded=false;
    var disabled=false;
    var appName = "Git helper";
    chrome.storage.sync.get('disabled', function(itemz) {
        disabled = itemz.disabled;
        if (typeof disabled !== typeof undefined && disabled !== false) {

        }else{
            disabled = false;
        }
         mainFunction();
         var oldLocation = location.href;
         setInterval(function() {
             if(!disabled){
              if(location.href != oldLocation) {
                   // do your action
                 //  if (location.href.indexOf('files')>0){
                       if($(".progress").width() >= $("body").width())
                       {
                           setTimeout(reloadApp, 200);
                           oldLocation = location.href;
                       }
                 //  }

              }
            }
         }, 1000); // check every second

         if (disabled)
         {
             $('#gitHelperTab').remove();
             $('.tabnav-tabs').append('<a class="tabnav-tab js-pjax-history-navigate" id="gl-actions-enable">Enable '+appName+'</a>');
         }
    });

    function reloadApp(delay){
        if(!disabled){
            if($(".progress").width() >= $("body").width())
            {
                mainFunction();
            }
            else {
                setTimeout(reloadApp, delay);
            }
        }
    }
    function getDefaultJsonFile() {
        return chrome.extension.getURL("rules.json");
    }

    function addJsonToTextArea(jsonData){
        if ($( "#jsonData" ).length) {
            try {
                $('#jsonData').val(JSON.stringify(jsonData));
                var ugly = $('#jsonData').val();
                var obj = JSON.parse(ugly);
                var pretty = JSON.stringify(obj, undefined, 4);
                $('#jsonData').val(pretty);
            }
            catch (e) {
                showMessage("Invalid JSON. Try fixing it <a href='http://jsonlint.com/' target='_blank'>here</a>");
                return false;
            }
            return true;
        }else{
            setTimeout(function() {
                showMessage('Linting....');
                mainFunction();
            }, 500)
        }
    }
    $('body').on('click', 'a', function(){
        var attr = $(this).attr('href');
        // For some browsers, `attr` is undefined; for others,
        // `attr` is false.  Check for both.
        if (typeof attr !== typeof undefined && attr !== false) {
            if($(this).attr('href') && $(this).attr('href').indexOf('files') > 0)
            {
                window.location = $(this).attr('href');
            }        // ...
        }
    })

    function mainFunction()
    {
        if (!disabled && window.location.href.indexOf("files") > 0){
            showMessage('linting');
            debugX=0;
            rules = null;
            errorCount = 0;
            loaded=false;
            applyUI();
            chrome.storage.sync.get('jsonData', function(items) {
                var jsonData = items.jsonData;
                if (jsonData) {
                    applyJson(jsonData);
                } else {
                    jsd = getDefaultJsonFile();
                    $.getJSON(jsd, function(result){
                        chrome.storage.sync.set({"jsonData": result}, function() {
                            applyJson(result);
                        });
                    });
                }
            });
        }
    }

    function runTest()
    {
        try {
            jsonDataTemp = JSON.parse($('#jsonData').val());
            return applyJson(jsonDataTemp);
        } catch (e) {
            showMessage("Invalid JSON. Try fixing it <a href='http://jsonlint.com/' target='_blank'>here</a>");
            return false;
        }
    }

    function applyJson(jsonData)
    {
        var loaded=false;
        try {
            loaded = runLinter(jsonData);
        } catch (e) {
            showMessage("Invalid JSON. Try fixing it <a href='http://jsonlint.com/' target='_blank'>here</a>");
            return false;
        } finally {
            setTimeout(function(){
                if (!loaded)
                {
                    showMessage("Invalid JSON. Try fixing it <a href='http://jsonlint.com/' target='_blank'>here</a>");
                    return false;
                }
            }, 1000);
        }

        return true;
    }

    function showMessage(message, extraClass='', append=false){
        if(!append)
        removeMessages();
        $('.gh-header-title').append("<span class='gitlint-message "+extraClass+"'>"+message+"</span>");
    }

    function removeMessages(){
        $('.gitlint-message').remove();
    }
    function loadMenuButton(){
        $('#gitHelperTab').remove();
        $('.tabnav-tabs').append('<a class="tabnav-tab js-pjax-history-navigate" id="gitHelperTab">'+appName+'</a>');

        $('body').on('click', '#gitHelperTab', function(){
            if ($("#gl-lint-options").attr('visible')=="true")
            {
                $("#gl-lint-options").attr('visible',"false");
                $('.tabnav-tabs a').removeClass('selected');
                $(this).addClass('selected');
                $('#gl-lint-options').slideUp();
            } else {
                chrome.storage.sync.get('jsonData', function(items) {
                    var jsonData = items.jsonData;
                    if (jsonData) {
                        addJsonToTextArea(jsonData);
                    }
                });
                $("#gl-lint-options").attr('visible',"true");
                $('.tabnav-tabs a').removeClass('selected');
                $(this).addClass('selected');
                $('#gl-lint-options').slideDown();
            }
        })
        loadMenu();
    }

    function loadMenu(){
        var statusClass='enabled';
        if(disabled)
        {
            statusClass='disabled';
        }
        $( "<div id='gl-lint-options' class='"+statusClass+"'></div>" ).insertAfter( ".tabnav-tabs" );
        var menuTemplate = chrome.extension.getURL("menu.template.html");
        $('#gl-lint-options').load(menuTemplate);
    }


        $('body').on('click', '#gl-actions-reset', function(){
                resetToDefault();
                window.location.reload(true);
        });
            $('body').on('click', '#gl-actions-enable', function(){
                chrome.storage.sync.set({"disabled": 0}, function() {
                toastMessage(appName + ' enabled', 'good');
                    window.location.reload(true);
                });
            });

    $('body').on('click', '#gl-actions-disable', function(){
        chrome.storage.sync.set({"disabled": 'yes'}, function() {
            
            toastMessage(appName + ' disabled', 'good');
            window.location.reload(true);
        });
    });

    $('body').on('click', '#gl-actions-run', function(){
        if(!disabled){
            try {
                var ok = runTest();
                if(!ok) {
                    showMessage("Could not run please check json");
                }

            } catch (e) {
                showMessage("Could not run please check json");
            }
        }
    })

    $('body').on('click', '#gl-actions-save', function(){
        if(!disabled){
            try {
                var jsonDataNew = JSON.parse($('#jsonData').val());
                if(runTest())
                {
                    chrome.storage.sync.set({"jsonData": jsonDataNew}, function() {
                        console.log("saved");
                        showMessage(' :: Saved', '', true);
                        toastMessage('Json saved!', 'good');
                    });
                }
                else{
                    showMessage("Invalid JSON. Try fixing it <a href='http://jsonlint.com/' target='_blank'>here</a>");
                    console.log('failed test');
                    toastMessage('Coud not save JSON. Please check formatting', 'bad');
                }
            } catch (e) {
                toastMessage('Coud not save JSON. Please check formatting', 'bad');
                showMessage("Could not run please check json");
            }
        }
    })
    
    function toastMessage(message, extraClass='')
    {
        $('body').append('<div class="gl-toast-message '+extraClass+'">'+message+'</div>');
        $('.gl-toast-message').delay(1500).fadeOut();
    }

    function runLinter(rulesJson)
    {
        if(!disabled){
            errorCount = 0;
            $('.gl-added-warnings').remove();
            $(".blob-code").removeClass('gl-yellow');
            console.log("begin");
            rules = (rulesJson);
            return setRules(rules);
            console.log('end');
        }
    }

    function applyUI()
    {
        loadMenuButton();
    }

    function setRules(rules)
    {
        try {
            // Check new lines
            $(".blob-code").each(function(elem){
                if (!$(this).hasClass('blob-code-deletion'))
                {
                    errorMessage = hasError($(this));
                    if (errorMessage){
                        setError($(this), errorMessage);
                        errorCount ++;
                    }
                }
            });
            // link to first error if exists
            if (errorCount > 0)
            {
                showMessage('<a href="#0-added-warning">['+errorCount+' issues]</a>');
            }
            else
            {
                showMessage('[No issues]');
            }

        } catch (e) {
            showMessage('Oops!');
            return false;
        }
        return true;
    }

    function hasError(elem)
    {

        $fileTypeElement = (elem).closest('.js-details-container').find('.user-select-contain');
        var fileName = $fileTypeElement.text();
        var fileType = $.trim(fileName.split('.').pop());
        lineText = elem.text();
        var n = '';
        return checkLine(lineText, fileType);

    }

    function checkLine(lineText, fileType)
    {
        var iii=0;
        for(var index in rules)
        {
            specificRules = rules[index];
            var languages = specificRules.languages;
            if (languages.indexOf(fileType) > -1 || languages.indexOf("all") > -1)
            {
                var ret = applyRules(lineText, specificRules.rules);
                if (ret) {
                    return ret;
                }
            }
        }
        return false;
    }


    function applyRules(lineText, rulesForLanguage)
    {
        for (j in rulesForLanguage)
        {
            try
            {
                rule = rulesForLanguage[j];
                if (rule.matches)
                {
                    matches = rule.matches;
                    for (k in matches)
                    {
                        if (lineText.indexOf(matches[k]) > -1)
                        {
                            var ret = rule.message;
                            exceptions = rule.exceptions;
                            for (p in exceptions)
                            {
                                if (lineText.indexOf(exceptions[p]) > -1)
                                {
                                    ret = false;;
                                }
                            }
                            if(ret)
                            {
                                return rule.message;
                            }
                        }
                    }
                }

                if (rule.regexes)
                {
                    regexes = rule.regexes;
                    for (r in regexes)
                    {
                        var reg = new RegExp(regexes[r]);
                        var regMatches = lineText.match(reg);
                        if (regMatches)
                        {
                            var ret = rule.message;
                            exceptions = rule.exceptions;
                            for (p in exceptions)
                            {
                                if (lineText.indexOf(exceptions[p]) > -1)
                                {
                                    ret = false;;
                                }
                            }
                            if(ret)
                            {
                                return rule.message;
                            }
                        }
                    }
                }

            } catch (e) {
                showMessage('There was a problem with the following rule: '+rule);
            }

        }

        return false;
    }


    var errorColor = "yellow";
    function setError(elem, message, bgCol)
    {
        bgCol = typeof bgCol !== 'undefined' ? bgCol : errorColor;

        elem.addClass("gl-"+bgCol);
        elem.attr("title", message);
        elem.append('<span id="'+(errorCount)+'-added-warning" class="gl-added-warnings"><a href="#'+(errorCount+1)+'-added-warning">next</a></span>');
        return true;
    }

    function resetToDefault(){
        var keys = ["jsonData", "jsonDataTemp"];
        try {
            chrome.storage.sync.remove(keys);
        } catch (e) {
            showMessage("Could not restore to default");
        }
    }
})
