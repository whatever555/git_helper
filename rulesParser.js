$(document).ready(function(){
    var debugX=0;
    var rules = null;
    var errorCount = 0;
    var loaded=false;
    //resetToDefault();
    mainFunction();
    var oldLocation = location.href;

     setInterval(function() {
          if(location.href != oldLocation) {
              console.log("ULR UPDAED");
               // do your action
             //  if (location.href.indexOf('files')>0){
                   console.log($(".progress").width()+"<<<<Width"+$("body").width());
                   if($(".progress").width() >= $("body").width())
                   {
                       setTimeout(reloadApp, 200);
                       oldLocation = location.href;
                   }
             //  }

          }
      }, 1000); // check every second

    function reloadApp(delay){
        if($(".progress").width() >= $("body").width())
        {
            mainFunction();
        }
        else {
            setTimeout(reloadApp, delay);
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
        if (window.location.href.indexOf("files") > 0){
            showMessage('linting');
            debugX=0;
            rules = null;
            errorCount = 0;
            loaded=false;
            applyUI();
            chrome.storage.sync.get('jsonData', function(items) {
                var jsonData = items.jsonData;
                if (jsonData) {
                    if (addJsonToTextArea(jsonData))
                    applyJson(jsonData);
                } else {
                    jsd = getDefaultJsonFile();
                    $.getJSON(jsd, function(result){
                        chrome.storage.sync.set({"jsonData": result}, function() {
                            if (addJsonToTextArea(result))
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
            console.log("There is an issue with your JSON file");
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

    function showMessage(message, extraClass=''){
        removeMessages();
        $('.gh-header-title').append("<span class='gitlint-message "+extraClass+"'>"+message+"</span>");
    }

    function removeMessages(){
        $('.gitlint-message').remove();
    }
    function loadMenuButton(){
        $('#gitHelperTab').remove();
        $('.tabnav-tabs').append('<a class="tabnav-tab js-pjax-history-navigate" id="gitHelperTab">Git Linter</a>');

        $('#gitHelperTab').on('click', function(){
            if ($("#gl-lint-options").attr('visible')=="true")
            {
                $("#gl-lint-options").attr('visible',"false");
                $('.tabnav-tabs a').removeClass('selected');
                $(this).addClass('selected');
                $('#gl-lint-options').slideUp();
            } else {
                $("#gl-lint-options").attr('visible',"true");
                $('.tabnav-tabs a').removeClass('selected');
                $(this).addClass('selected');
                $('#gl-lint-options').slideDown();
            }
        })
        loadMenu();
    }

    function loadMenu(){
        $( "<div id='gl-lint-options'></div>" ).insertAfter( ".tabnav-tabs" );
        var menuTemplate = chrome.extension.getURL("menu.template.html");
        $('#gl-lint-options').load(menuTemplate);
    }

    $('body').on('click', '#gl-actions-run', function(){
        try {
            var ok = runTest();
            if(!ok) {
                showMessage("Could not run please check json");
            }

        } catch (e) {
            showMessage("Could not run please check json");
        }
    })

    $('body').on('click', '#gl-actions-save', function(){
        try {
            var jsonDataNew = JSON.parse($('#jsonData').val());

            if(runTest())
            {
                chrome.storage.sync.set({"jsonData": jsonDataNew}, function() {
                    console.log("saved");
                });
            }
            else{
                showMessage("Invalid JSON. Try fixing it <a href='http://jsonlint.com/' target='_blank'>here</a>");
                console.log('failed test');
            }
        } catch (e) {
            showMessage("Could not run please check json");
        }
    })

    function runLinter(rulesJson)
    {
        errorCount = 0;
        $('.gl-added-warnings').remove();
        $(".blob-code").removeClass('gl-yellow');
        console.log("begin");
        rules = (rulesJson);
        return setRules(rules);
        console.log('end');
    }

    function applyUI()
    {
        loadMenuButton();
    }

    function setRules(rules)
    {
        console.log("RULES");
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
                showMessage('<a href="#1-added-warning">['+errorCount+' issues]</a>');
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
                console.log('There was a problem with the following rule:');
                console.table(rule);
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

    chrome.storage.onChanged.addListener(function(changes, namespace) {

      for (key in changes) {
        var storageChange = changes[key];
        console.log('Storage key "%s" in namespace "%s" changed. ' +
                    'Old value was "%s", new value is "%s".',
                    key,
                    namespace,
                    JSON.stringify(storageChange.oldValue),
                    JSON.stringify(storageChange.newValue));
      }
    });

})
