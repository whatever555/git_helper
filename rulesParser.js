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
             $('#gl-helper-tab-button').remove();
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
        return chrome.extension.getURL("simple.rules.json");
    }

    function addJsonToTextArea(jsonData){
        if ($( "#gl-json-data-textarea" ).length) {
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
            if($(this).attr('href') && ($(this).attr('href').indexOf('files') > 0 || $(this).attr('href').indexOf('compare') > 0  ))
            {
                window.location = $(this).attr('href');
            }        // ...
        }
    })
    $('body').on('click', '#gl-edit-rules', function(){
        console.log($('#gl-json-data-textarea').attr('disabled'));
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
        console.log('werwe');
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

    function mainFunction()
    {
        if (!disabled && (window.location.href.indexOf("files") > 0 || window.location.href.indexOf("compare") > 0)){
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

    function showMessage(message, extraClass='', append=false){
        if(!append)
        removeMessages();
        $('.gh-header-title').append("<span class='gitlint-message "+extraClass+"'>"+message+"</span>");
        toastMessage(message);
    }

    function removeMessages(){
        $('.gitlint-message').remove();
    }
    function loadMenuButton(){
        $('#gl-helper-tab-button').remove();
        $('.tabnav-tabs').append('<a class="tabnav-tab js-pjax-history-navigate" id="gl-helper-tab-button">'+appName+'</a>');

        $('body').on('click', '#gl-helper-tab-button', function(){
            if ($("#gl-lint-options").attr('visible')=="true")
            {
                $("#gl-lint-options").attr('visible',"false");
                $('.tabnav-tabs a').removeClass('selected');
                $(this).addClass('selected');
                $('#gl-lint-options').slideUp();
            } else {
                console.log('nothit');
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
                if (window.confirm("Warning\nThis will overwrite all of your current JSON rules\nAre you sure you want to continue?")) {

                    showMessage("Resetting json file to default");
                    resetToDefault();
                    window.location.reload(true);
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
                if(runTest())
                {
                    chrome.storage.sync.set({"jsonData": jsonDataNew}, function() {
                        console.log("saved");
                        $('#gl-actions-save').attr('disabled', 'disabled');
                        $('#gl-actions-cancel').attr('disabled', 'disabled');
                        toastMessage('Saved', 'good');
                    });
                }
                else{
                    showMessage("Invalid JSON. Try fixing it <a href='http://jsonlint.com/' target='_blank'>here</a>");
                    console.log('failed test');
                }
            } catch (e) {
                showMessage("Could not run please check json");
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
            // link to first error if exists
            if (errorCount > 0)
            {
                showMessage('<a href="#0-added-warning">'+errorCount+' issues found in this PR</a>');
            }
            else
            {
                showMessage('No issues found in PR');
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
})
