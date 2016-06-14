$(document).ready(function(){

    var errorColor = "orange";
    var warningColor = "yellow";
    var errorCount = 0;

    // Check new lines
    $("#files_bucket .blob-code").each(function(elem){
        console.log("checking");
        if (hasError($(this))){
            errorCount ++;
        }
    });
    // link to first error if exists
    if (errorCount > 0)
    {
        $('.gh-header-number').append("<a href='#0-added-warning'><b style='color:orange'>["+errorCount+" issues]</b></a>");
    }
    else
    {
        $('.gh-header-number').append("<b style='color:orange'>[No issues]</b>");
    }

    function hasError(elem)
    {
        $fileTypeElement = (elem).closest('.js-details-container').find('.user-select-contain');
        var fileName = $fileTypeElement.text();
        var fileType = $.trim(fileName.split('.').pop());
        lineText = elem.text();
        var n = '';

        /*
         * GENERAL RULES
         */
        if (lineText.length > 140)
        {
            return setError(elem, "Is this line too long?", warningColor);
        }

        /*
         * PHP RULES
         */
        if (fileType == "php")
        {
            // Check for get instance
            n = lineText.indexOf(":getInstance");
            if (n > -1)
            {
                // Allow exceptions for search, Html and Mysql
                if (lineText.indexOf("Mysql") == -1 && lineText.indexOf("Html") == -1 && lineText.indexOf("Search") == -1)
                {
                    return setError(elem, "Is getInstance() the best approach here?", warningColor);
                }
            }

            var n = lineText.indexOf("notice(");
            if (n > -1)
            {
                return setError(elem, "Debug maybe?");
                return true;
            }

            n = lineText.indexOf("<?= echo");
            if (n > -1)
            {
                return setError(elem, "Remove echo");
            }

            n = lineText.indexOf("var_dump");
            if (n > -1)
            {
                return setError(elem, "Debug?");
            }

            // Old Text
            n = lineText.indexOf("PHP version");
            if (n > -1)
            {
                return setError(elem, "Is this line needed?");
            }

            n = lineText.indexOf("== null");
            if (n > -1)
            {
                return setError(elem, "Should use 'is_null()'");
            }

            n = lineText.indexOf("!= null");
            if (n > -1)
            {
                return setError(elem, "Should use '!is_null()'");
            }

        }

        if (fileType == "js")
        {
            n = lineText.indexOf("console.");
            if (n > -1)
            {
                return setError(elem, "Debug?");
            }
        }


        /*
          * PHP AND JS RULES
          *
          */
        if (fileType == "js" || fileType == "php")
        {

            n = lineText.indexOf("if(");
            if (n > -1)
            {
                return setError(elem, "Missing Space before open bracket");
            }

            n = lineText.indexOf("for(");
            if (n > -1)
            {
                return setError(elem, "Missing Space before open bracket");
            }

            n = lineText.indexOf("while(");
            if (n > -1)
            {
                return setError(elem, "Missing Space before open bracket");
            }

            n = lineText.indexOf("foreach(");
            if (n > -1)
            {
                return setError(elem, "Missing Space before open bracket");
            }

            n = lineText.indexOf("){");
            if (n > -1)
            {
                return setError(elem, "Missing Space before curly bracket");
            }

            n = lineText.indexOf("else{");
            if (n > -1)
            {
                return setError(elem, "Missing Space before curly bracket");
            }

            n = lineText.indexOf("else {");
            if (n > -1)
            {
                return setError(elem, "Curly bracket shoud be on next line?");
            }

            n = lineText.indexOf(",['\"]");
            if (n > -1)
            {
                return setError(elem, "Missing space after comma");
            }

            // Conditionals missing spaces
            var matches = lineText.match(/[A-Z][&*\>\<|=!][A-Z]/);

            if (matches) {
                return setError(elem, "Conditional Missing Space");
            }

            // Comments missing space
            matches = lineText.match(/\/\/\S/);

            if (matches) {
                if (!lineText.indexOf("http"))
                {
                    return setError(elem, "Comment Missing Space after slashes");
                }
            }

            // Comments lower case first char
            matches = lineText.match(/\/\/\s[a-z]/);

            if (matches) {
                return setError(elem, "Comment should begin with upper case letter");
            }

            // Docblock missing space
            matches = lineText.match(/[\/][\*][A-Z/i]/);

            if (matches) {
                return setError(elem, "Comment Missing Space after slash star (/*)");
            }

            // MIssing space in docblock
            matches = lineText.match(/\s\*\@/);

            if (matches) {
                return setError(elem, "Missing space in docblock?");
            }

        }


        /*
          * CSS RULES
          *
          */
        if (fileType == "css")
        {
            // No space (eg: float:right)
            matches = lineText.match(/\:\S/);

            if (matches) {
                if (lineText.indexOf("\{") == -1)
                {
                    return setError(elem, "Missing space?");
                }
            }

            // Typo
            matches = lineText.match(/[0-9]xp/);

            if (matches) {
                return setError(elem, "Should this be px?");
            }

            // Missing Space
            matches = lineText.match(/[a-z\i0-9]\{/);

            if (matches) {
                return setError(elem, "Missing Space?");
            }
        }

        return false;
    }

    function setError(elem, message, bgCol)
    {
        bgCol = typeof bgCol !== 'undefined' ? bgCol : errorColor;
        elem.css("background-color", bgCol);
        elem.attr("title", message);
        elem.append('<span style="float: right; background-color: orangered;" id="'+(errorCount)+'-added-warning"><a href="#'+(errorCount+1)+'-added-warning" style="color: white">next</a></span>');
        return true;
    }
})