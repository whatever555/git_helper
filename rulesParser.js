$(document).ready(function(){
    $.ajaxSetup({ cache: false });
    var debugX=0;
    var rules = null;
    var errorCount = 0;
    var loaded=false;
    var disabled=false;
    var appName = "Git helper";
    var quiteMode=false;
    var lineNumbersSet=false;
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
             $('#gl-helper-tab-button').remove();
             var svgCode='<svg aria-hidden="true" class="octicon octicon-mark-github gl-svg" height="14" version="1.1" viewBox="0 0 16 16" width="14"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"></path></svg>';
             $('.tabnav-pr .tabnav-tabs').append('<a class="tabnav-tab js-pjax-history-navigate" id="gl-actions-enable">'+svgCode+'Enable '+appName+'</a>');
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
        return chrome.extension.getURL("simple.rules.json")+"?"+makeRandomId;
    }

    function resetJsonDataToDefault(){
        jsd = getDefaultJsonFile();
        $.getJSON(jsd, function(result){
            addJsonToTextArea(result);
        });
    }

    function addJsonToTextArea(jsonData){
        if ($("#gl-json-data-textarea").length) {
            try {
                $('#gl-json-data-textarea').val(JSON.stringify(jsonData));
                var ugly = $('#gl-json-data-textarea').val();
                var obj = JSON.parse(ugly);
                var pretty = JSON.stringify(obj, undefined, 4);
                $('#gl-json-data-textarea').val(pretty);
            }
            catch (e) {
                showMessage("Invalid JSON. Try fixing it <a href='http://jsonlint.com/' target='_blank'>here</a>");
                return false;
            }
            if(!lineNumbersSet){
                lineNumbersSet=true;
                $("#gl-json-data-textarea").numberedtextarea();
            }
            return true;
        }else{
            setTimeout(function() {
                addJsonToTextArea(jsonData);
            }, 550)
        }
    }
    $('body').on('click', 'a', function(){
        var attr = $(this).attr('href');
        // For some browsers, `attr` is undefined; for others,
        // `attr` is false.  Check for both.

        if (typeof attr !== typeof undefined && attr !== false) {
            if($(this).attr('href') && ($(this).attr('href').indexOf('files') > 0 || $(this).attr('href').indexOf('compare') > 0  ))
            {
                window.location.reload(false);
            }        // ...
        }
    })
    $('body').on('click', '#gl-edit-rules', function(){
        if ($('#gl-json-data-textarea').attr('disabled') == 'disabled')
        {
            $('.gl-io-buttons').fadeIn();
            $('#gl-json-data-textarea').attr('disabled',false);
            $('#gl-json-data-textarea-holder').addClass('editable');
            $(this).addClass('selected');

        }
        else {
            $('.gl-io-buttons').fadeOut();
            $('#gl-json-data-textarea').attr('disabled','disabled');
            $('#gl-json-data-textarea-holder').removeClass('editable');
            $(this).removeClass('selected');
        }
    })

    $('body').on('keyup', '#gl-json-data-textarea',function(){
        if($('#gl-actions-save').attr('disabled') == 'disabled')
        {
            chrome.storage.sync.get('jsonData', function(items) {
                var jsonData = items.jsonData;
                var newJson = $('#gl-json-data-textarea').val();
                if (newJson != jsonData)
                {
                    $('#gl-actions-save').attr('disabled', false);
                    $('#gl-actions-cancel').attr('disabled', false);
                }
            });
        }
    })

    $('body').on('click', '#gl-actions-cancel', function(){
        chrome.storage.sync.get('jsonData', function(items) {
            addJsonToTextArea(items.jsonData);
            showMessage('Changes have been cancelled');
            $('#gl-actions-save').attr('disabled', 'disabled');
            $('#gl-actions-cancel').attr('disabled', 'disabled');
        });
    })
    
    $('body').on('click', '#run-anyway', function(){
        mainFunction(true);
    })

    function mainFunction(ignoreFileLimit = false)
    {
        if ($("#gl-lint-options").length)
        $("#gl-lint-options").remove();
        if (!disabled && (window.location.href.indexOf("pull/") > 0 || window.location.href.indexOf("compare") > 0)){
        
            var fileLimitReached = false;
            var fileCount = parseInt($('#files_tab_counter').html());
            if (fileCount > 50)
            {
                fileLimitReached= true;
            }
            
            debugX=0;
            rules = null;
            errorCount = 0;
            loaded=false;
            applyUI(window.location.href.indexOf("files") > 0);

            if (window.location.href.indexOf("files") > 0)
            {
                showMessage('Checking...');
                loadMenu();
                if (window.location.href.split('?')[1] == 'gl-show')
                {
                    showHideUI();
                }
                if (fileLimitReached && !ignoreFileLimit) {
                    showMessage('Too many files for github helper to work with (still just beta!) <span id="run-anyway">Run anyway?</span>', 'bad');
                }
                else {
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
        }
    }

    function runTest()
    {
        try {
            jsonDataTemp = JSON.parse($('#gl-json-data-textarea').val());
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

    function showMessage(message, extraClass='', append=false, noToast=false){
        var imgURL = chrome.extension.getURL("icon48.png");
        var iconCode = '<img class="gl-icon-image" src="'+imgURL+'" height=24 width=24 />';
        //var svgCode='<svg aria-hidden="true" class="octicon octicon-mark-github gl-svg" height="14" version="1.1" viewBox="0 0 16 16" width="14"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"></path></svg>';
        if(!$('.gitlint-message').length>0)
        {
            $("<div class='gitlint-message'></div>").insertAfter('.tabnav-pr .tabnav-tabs');
            $('.gitlint-message').fadeIn();
        }
        if(!quiteMode)
        {

            $('.gitlint-message').html(iconCode+appName+": "+message+"");
            if(!noToast)
                toastMessage(message, extraClass);
        }else {
            $('.gitlint-message').remove();
        }
    }

    function loadMenuButton(noLink=true){
        var link = '';
        if (!noLink)
            link='href = "'+window.location.href.split('?')[0].replace('/commits','')+'/files?gl-show"';
        if(('#gl-helper-tab-button').length)
        {
            $('#gl-helper-tab-button').remove();
        }
        //var svgCode='<svg aria-hidden="true" class="octicon octicon-mark-github gl-svg" height="14" version="1.1" viewBox="0 0 16 16" width="14"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"></path></svg>';
        var imgURL = chrome.extension.getURL("icon48.png");
        var iconCode = '<img class="gl-icon-image small" src="'+imgURL+'" height=14 width=14 />';
        $('.tabnav-pr .tabnav-tabs').append('<a '+link+' class="tabnav-tab js-pjax-history-navigate" id="gl-helper-tab-button">'+iconCode+appName+'</a>');

    }

    $('body').on('click', '#gl-helper-tab-button', function(){
        showHideUI();
    })




function showHideUI(){
    $tabBut=$('#gl-helper-tab-button');
    if ($("#gl-lint-options").attr('visible')=="true")
    {
        $("#gl-lint-options").attr('visible',"false");
        $('.tabnav-pr .tabnav-tabs a').removeClass('selected');
        $tabBut.removeClass('selected');
        $('#gl-lint-options').slideUp();
    } else {
        chrome.storage.sync.get('jsonData', function(items) {
            var jsonData = items.jsonData;
            if (jsonData) {
                addJsonToTextArea(jsonData);
            }
        });
        $("#gl-lint-options").attr('visible',"true");
        $('.tabnav-pr .tabnav-tabs a').removeClass('selected');
        $tabBut.addClass('selected');
        $('#gl-lint-options').slideDown();
    }
}
    function loadMenu(){
        if ($('#gl-lint-options'),length){
            $('#gl-lint-options').remove();
        }
        var statusClass='enabled';
        if(disabled)
        {
            statusClass='disabled';
        }
        $( "<div id='gl-lint-options' class='"+statusClass+"'></div>" ).insertAfter( ".tabnav-pr .tabnav-tabs" );
        var menuTemplate = chrome.extension.getURL("menu.template.html");
        $('#gl-lint-options').load(menuTemplate);
    }


        $('body').on('click', '#gl-actions-reset', function(){
                if (window.confirm("Warning\n\nAre you sure you want to change json back to default?")) {
                    toastMessage("Resetting json to default. You will still need to save your changes.");
                    resetJsonDataToDefault();

                    $('#gl-actions-save').attr('disabled', false);
                    $('#gl-actions-cancel').attr('disabled', false);
                    //resetToDefault();
                    //window.location.reload(true);
                }
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
                var jsonDataNew = JSON.parse($('#gl-json-data-textarea').val());
                quiteMode = true;
                if(runTest())
                {
                    chrome.storage.sync.set({"jsonData": jsonDataNew}, function() {
                        $('#gl-actions-save').attr('disabled', 'disabled');
                        $('#gl-actions-cancel').attr('disabled', 'disabled');
                        toastMessage('Saved', 'good');
                    });
                }
                else{
                    quiteMode = false;
                    showMessage("Invalid JSON. Try fixing it <a href='http://jsonlint.com/' target='_blank'>here</a>");
                    
                }
            } catch (e) {
                quiteMode = false;
                showMessage("Could not run please check json");
            }
            finally{
                quiteMode = false;
            }
        }
    })

    var toastMessages = [];
    var toastRunning=false;
    var toastInstanceID = 1;
    function toastMessage(message, extraClass='')
    {
        toastMessages.push([message,extraClass]);
        if(toastRunning==false){
            toastInstanceID++;
            runToast(toastInstanceID);
        }else{
            $('.gl-toast-count').html('['+toastMessages.length+']');
        }
    }

    function runToast(td){
        if(td == toastInstanceID){
            toastRunning=true;
            var delayTime=1750;
            if(toastMessages.length>0)
            {
                data=toastMessages.shift();
                message=data[0];
                extraClass=data[1];
                extraHTML='<span class="gl-toast-count right"></span>';
                if(toastMessages.length>0)
                {
                    extraHTML = '<span class="gl-toast-count right">['+toastMessages.length+']</span>';
                }
                $('body').append('<div class="gl-toast-message '+extraClass+'">'+message+extraHTML+'<span class="gl-toast-x">X</span></div>');
                $('.gl-toast-message').show();
                $('.gl-toast-message').delay(delayTime).fadeOut();
                setTimeout(function() { runToast(td); }, delayTime);
            }
            else {
                toastRunning=false;
            }
        }
    }

    $('body').on('click','.gl-toast-x',function(){
        $('.gl-toast-message').fadeOut();
        toastInstanceID++;
        runToast(toastInstanceID);
    })

    function runLinter(rulesJson)
    {
        if(!disabled){
            errorCount = 0;
            $('.gl-added-warnings').remove();
            $(".blob-code").removeClass('gl-yellow');
            rules = (rulesJson);
            return setRules(rules);
        }
    }

    function applyUI(noLink=true)
    {
        loadMenuButton(noLink);
    }

    function setRules(rules)
    {
        try {
            // Check new lines
            $(".blob-code-inner").each(function(elem){
                if (!$(this).closest('.blob-code').hasClass('blob-code-deletion'))
                {
                    errorMessage = hasError($(this));
                    if (errorMessage){
                        setError($(this), errorMessage);
                        errorCount ++;
                    }
                }
            });
            var tmpQuiteMode=quiteMode;
            quiteMode=false;
            // link to first error if exists
            if (errorCount > 0)
            {
                showMessage('<a href="#0-added-warning">'+errorCount+' issues found in this PR</a>','',false, tmpQuiteMode);
            }
            else
            {
                showMessage('No issues found in PR','',false, tmpQuiteMode);
            }
            quiteMode=tmpQuiteMode;

        } catch (e) {
            showMessage('Oops!');
            return false;
        }
        return true;
    }

    function hasError(elem)
    {
        $fileTypeElement = (elem).closest('.js-details-container').find('.file-header').find('.file-info');
        var fileName = $fileTypeElement.text();
        var fileType = $.trim(fileName.split('.').pop());
        lineText = elem.text();
        if (lineText.indexOf('+')==0||lineText.indexOf('-')==0)
        {
            lineText=lineText.substring(1);
        }
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
                            regex_exceptions = rule.regex_exceptions;
                            for (p in regex_exceptions)
                            {
                                var regexep = new RegExp(regex_exceptions[r]);
                                var regexepMatches = lineText.match(regexep);
                                if (regexepMatches)
                                {
                                    ret = false;
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
                            regex_exceptions = rule.regex_exceptions;
                            for (p in regex_exceptions)
                            {
                                var regexep = new RegExp(regex_exceptions[r]);
                                var regexepMatches = lineText.match(regexep);
                                if (regexepMatches)
                                {
                                    ret = false;
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

        elem.closest('.blob-code').addClass("gl-"+bgCol);
        elem.closest('.blob-code').attr("title", message);
        elem.closest('.blob-code').append('<span id="'+(errorCount)+'-added-warning" class="gl-added-warnings"><a href="#'+(errorCount+1)+'-added-warning">next</a></span>');
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

    function makeRandomId()
    {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for( var i=0; i < 8; i++ )
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

})
