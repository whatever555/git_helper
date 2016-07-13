# Github code review helper
Use github helper to help you with reviewing code.
This tool can help find issues in your pull requests on github.  
you can set custom rules in json for any language

# Usage:
Open a PR page on github e.g: https://github.com/whatever555/git_helper/pull/5/files 
Hover over warning strip to see error message
Click on 'git helper' tab to edit json file and add/change/remove rules

# Json file
## keys
languages: an array of languages for which the set of rules apply. (comma separated). Based on file name extension for file (i.e 'js' for javascript files)
rules: the array rules to be applied
regexes: rules in regex pattern (comma separated)
matches: simple search rule (comma separated)
regex_exceptions: exception to rule in regex pattern (comma separated)
exceptions: simple search exceptions to rule (comma separated)
message: the warning message to be displayed when problematic code is hovered over
check_caps: set to "true" if rule requires case checking (will be updated soon)






