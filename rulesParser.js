$(document).ready(function(){

    var debugX=0;
    var rules = null;
    var errorCount = 0;
    var loaded=false;
    //resetToDefault();
    mainFunction();
    function getDefaultJsonFile() {
        return chrome.extension.getURL("rules.json");
    }
    
    function mainFunction()
    {
        chrome.storage.sync.get('jsonData', function(items) {
            var jsonData = items.jsonData;
            if (jsonData) {
                console.log("LOADED FROM LOCAL MEM");
                applyJson(jsonData);
            } else {
                console.log("LOADED FROM FILE");
                jsd = getDefaultJsonFile();
                $.getJSON(jsd, function(result){
                    chrome.storage.sync.set({"jsonData": result}, function() {
                        applyJson(result);
                    });
                });
            }
        });
        applyUI();
    }
    
    function runTest()
    {
        jsonDataTemp = JSON.parse($('#jsonData').val());   
        return applyJson(jsonDataTemp);
    }
    
    function applyJson(jsonData)
    {
        var loaded=false;
        try {
            loaded = runLinter(jsonData);
        } catch (e) {
            console.log("There is an issue with your JSON file");
            return false;
        } finally {
            setTimeout(function(){ 
                if (!loaded)
                {
                    showMessage('There is a problem with your rules.json file. Please fix and refresh this page before running again');
                    return false;
                }
            }, 1000);
        }
        
        return true;
    }
    
    function showMessage(message, append=false){
        if (!append){removeMessages();}
        $('.commit-title, .toc-diff-stats, .gh-header-title').append("<a target='_blank' href='https://github.com/whatever555/git_helper#support'><b style='color:orange' class='gitlint-message'>"+message+"</b></a>");
    }
        
    function removeMessages(){
        $('.gitlint-message').remove();
    }
    function loadMenuButton(){
        $('.tabnav-tabs').append('<a class="tabnav-tab js-pjax-history-navigate" id="gitHelperTab">Git Linter</a>');
        $('#gitHelperTab').on('click', function(){
            $('.tabnav-tabs a').removeClass('selected');
            $(this).addClass('selected');
            loadMenu();
        })
    }
    
    function loadMenu(){
        $( "<div id='gitLintMenu'></div>" ).insertAfter( ".tabnav-tabs" );
        var menuTemplate = chrome.extension.getURL("menu.template.html");
        $('#gitLintMenu').load(menuTemplate);
    }
    
    $('body').on('click', '#gl-actions-run', function(){
        try {
            var ok = runTest();
            console.log("test"+ok);
        } catch (e) {
        } 
    })
    
    $('body').on('click', '#gl-actions-save', function(){
        try {
            var jsonDataNew = JSON.parse($('#jsonData').val());
            
            if(runTest())
            {
                chrome.storage.sync.set({"jsonData": jsonDataNew}, function() {
                    console.log("SAVED");
                });   
            }
            else{
                console.log('failed test');
            }    
        } catch (e) {
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
                showMessage('['+errorCount+' issues]</b></a>');
            }
            else
            {
                showMessage('[No issues]</b>');
            }  chrome.storage.onChanged.addListener(function(changes, namespace) {
        for (key in changes) {
          var storageChange = changes[key];
          console.log('Storage key "%s" in namespace "%s" changed. ' +
                      'Old value was "%s", new value is "%s".',
                      key,
                      namespace,
                      storageChange.oldValue,
                      storageChange.newValue);
        }
      });
        
        } catch (e) {
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
                console.log('There was a problem with the following rule:');
                console.table(rule);
            }  chrome.storage.onChanged.addListener(function(changes, namespace) {
        for (key in changes) {
          var storageChange = changes[key];
          console.log('Storage key "%s" in namespace "%s" changed. ' +
                      'Old value was "%s", new value is "%s".',
                      key,
                      namespace,
                      storageChange.oldValue,
                      storageChange.newValue);
        }
      });
        }

        return false;
    }


    var errorColor = "yellow";
    function setError(elem, message, bgCol)
    {
        bgCol = typeof bgCol !== 'undefined' ? bgCol : errorColor;

        elem.addClass("gl-"+bgCol);
        elem.attr("title", message);
        elem.append('<span style="float: right; background-color: orangered;" id="'+(errorCount)+'-added-warning" class="gl-added-warnings"><a href="#'+(errorCount+1)+'-added-warning" style="color: white">next</a></span>');
        return true;
    }
    
    function resetToDefault(){
        var keys = ["jsonData", "jsonDataTemp"];
        try {    
            chrome.storage.sync.remove(keys);
        } catch (e) {
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