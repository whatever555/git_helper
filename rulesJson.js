var linting = {
	[
    	{
	    	"languages":"php",
	    	"rules":[
		    	{
		    		"match": ":getInstance",
		    		"exceptions":["Search", "Mysql", "Html"],
		    		"message": "Do you need to use getInstance() here?",
		    		"type": "warning"
		    	},{
		    		"match": "notice(",
		    		"exceptions":["$e->getMessage()"],
		    		"message": "Debug?"
		    	},{
		    		"match": "* Copyright (c)",
		    		"message": "Is this an out of date doclblock?"
		    	},{
		    		"match": "@copyright",
		    		"message": "Is this an out of date doclblock?"
		    	},{
		    		"match": "<?= echo",
		    		"message": "Remove echo"
		    	},{
		    		"match": "var_dump",
		    		"message": "Debug?"
		    	},{
		    		"match": "PHP Version",
		    		"message": "Is this line needed",
		    		"ignore_caps": "true"
		    	},{
		    		"match": "== null",
		    		"message": "Should this be is_null()?",
		    		"ignore_caps": "true"
		    	},{
		    		"match": "!= null",
		    		"message": "Should this be !is_null()?",
		    		"ignore_caps": "true"
		    	}
	    	]
    	},

    	{
	    	"languages":"js",
	    	"rules":[
		    	{
		    		"match": ":console.",
		    		"message": "Debug?"
		    	}
	    	]
    	}
	]
}