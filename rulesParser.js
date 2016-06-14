$(document).ready(function(){

    var debugX=0;
    var rules = null;
    var errorCount = 0;
    var loaded=false;
    //https://eddiemurphy.me/git-rules/rules.json
    try {
        var jsonFile = chrome.extension.getURL("rules.json");
        $.getJSON(jsonFile, function(response){
           loaded=true;
           init(response);
        })    
    } catch (e) {
        console.log("There is an issue with your JSON file");
    } finally {
        setTimeout(function(){ 
            if (!loaded)
            {
                $('.commit-title, .toc-diff-stats, .gh-header-title').append("<a target='_blank' href='https://github.com/whatever555/git_helper#support'><b style='color:orange'>There is a problem with your rules.json file. Please fix and refresh this page before running again</b></a>");
            }
        }, 1000);

    }

    function init(rulesJson)
    {
        console.log("begin");
        rules = (rulesJson);
        setRules(rules);
        console.log('end');
    }

    function setRules(rules)
    {
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
            $('.commit-title, .toc-diff-stats, .gh-header-title').append("<a href='#0-added-warning'><b style='color:orange'>["+errorCount+" issues]</b></a>");
        }
        else
        {
            $('.commit-title, .toc-diff-stats, .gh-header-title').append("<b style='color:orange'>[No issues]</b>");
        }
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
            }
        }

        return false;
    }


    var errorColor = "yellow";
    function setError(elem, message, bgCol)
    {
        bgCol = typeof bgCol !== 'undefined' ? bgCol : errorColor;
        if(elem.hasClass('blob-code-context'))
        {
            bgCol = '#ffc';
        }  
        elem.css("background-color", bgCol);
        elem.attr("title", message);
        elem.append('<span style="float: right; background-color: orangered;" id="'+(errorCount)+'-added-warning"><a href="#'+(errorCount+1)+'-added-warning" style="color: white">next</a></span>');
        return true;
    }

})