/*
 * n.rte
 * 
 * Version: 1.0.1b
 * License: GNU GPLv3
 * 
 */
(function($) {
    $.rte = function(el, options) {
        // To avoid scope issues, use 'base' instead of 'this'
        // to reference this class from internal events and functions.
        var base = this;
        
        // Access to jQuery and DOM versions of element
        base.$el = $(el);
        base.el = el;
        
        // Add a reverse reference to the DOM object
        base.$el.data("rte", base);
        
        // Declare constants
        var EDITOR_CLASS = 'rte';
        
        base.init = function() {
            base.options = $.extend({},$.rte.defaultOptions, options);
            
            // Initialization code
            var buttons = new Array;
            $.each(base.options.commands.split("|"), function (idx, button) {
                var items = button.split(","),
                    name = items[0];
                buttons[name] = {
                    stripIndex: idx,
                    name: name,
                    title: items[1] == "" ? name.charAt(0).toUpperCase() + name.substr(1) : items[1],
                    command: items[2] == "" ? name : items[2],
                    popup: items[3] == "" ? name : items[3]
                };
            });
            
            base.$el.hide();
            
            // Wrap the editor with a div
            var $wrapper = $('<div>').addClass(EDITOR_CLASS).width(base.options.width).height(base.options.height).insertBefore(base.$el).append(base.$el);
            
            // Create iframe
            var $iframe = $('<iframe frameborder="0" src="javascript:true;" />').appendTo($wrapper);
            
            var doc = $iframe[0].contentWindow.document,
            $doc = $(doc);
            
            doc.open();
            doc.write(base.options.frameDoc + '<html>' + ((base.options.frameCSS == '') ? '' : '<head><link rel="stylesheet" type="text/css" href="' + base.options.frameCSS + '" /></head>') + '<body style="' + base.options.frameBody + '" class="body-editor">' + base.$el.val() + '</body></html>');
            doc.close();
            doc.designMode = "on";
            
            // Create toolbar and buttons
            var $toolbar = $('<div>').addClass(EDITOR_CLASS + '-toolbar').prependTo($wrapper);
            var $buttongroup = $('<div>').addClass(EDITOR_CLASS +'-buttons').appendTo($toolbar);
            var $view = $('<input type="hidden" />').val('0');
            var $popup = $('<div>').addClass(EDITOR_CLASS + '-popup').css('position', 'absolute').prependTo($wrapper).hide();
            
            base.$wrapper = $wrapper;
            base.$iframe = $iframe;
            base.$doc = $doc;
            base.$toolbar = $toolbar;
            base.$buttongroup = $buttongroup;
            base.$view = $view;
            base.$popup = $popup;
            
            base.buttons = buttons;
            
            $.each(base.options.controls.split(" "), function (idx, butt) {
            	if (butt == "") return true;
                if (butt == "|") {
                    var $div = $('<div>').addClass(EDITOR_CLASS + '-separator').appendTo($buttongroup);
                    $buttongroup = $('<div>').addClass(EDITOR_CLASS + '-buttons').appendTo($toolbar);
                } else {
                	var button = buttons[butt];
                	var $button = $('<div>').data('buttonName', button.name).addClass(EDITOR_CLASS + '-button').addClass(EDITOR_CLASS + '-' + button.name).attr("title", button.title).bind('click', $.proxy(base.buttonClick, base)).appendTo($buttongroup);
                }
            });
            
            // Fix the width/height of editor
            $iframe.width($wrapper.width()).height($wrapper.outerHeight() - $toolbar.outerHeight() - 2);
            base.$el.width($wrapper.width()).height($wrapper.outerHeight() - $toolbar.outerHeight() - 2);
            
            // Hide popups when editing
            base.$doc.click(function() {
            	base.$popup.fadeOut(150, function() { $(this).html(''); });
            });
            
            // Make sure the content in textarea and iframe's body is the same.
            base.$iframe.contents().find('body').html(base.$el.val());
            
            base.$doc.keyup(function() {
            	base.updateEditor(base);
            });
            
            base.$doc.mouseup(function() {
            	base.updateEditor(base);
            });
        };
        
        /*
        base.FUNCTION = function(params) {
        	
        }
        */
        
        base.buttonClick = function(e) {
        	var base = this;
            buttonDiv = e.target;
            buttonName = $(buttonDiv).data('buttonName');
            button = base.buttons[buttonName];

	        var data = {
	            editor: base,
	            button: buttonDiv,
	            buttonName: buttonName,
	            command: button.command,
	            value: null,
	            useCSS: base.options.useCSS,
	            popup: button.popup
	        };
	        
	        if (data.buttonName == 'html') {
	        	if (base.$view.val() == '0') {
	        		$('.rte-html').addClass(EDITOR_CLASS + '-html-active');
	        		base.updateEditor(base);
	        		base.$el.show();
	        		base.$iframe.hide();
	        		base.$toolbar.fadeTo(150, 0.5);
	        		base.$view.val('1');
	        	} else {
	        		$('.rte-html').removeClass(EDITOR_CLASS + '-html-active');
	        		base.updateFrame();
	        		base.$el.hide();
	        		base.$iframe.show();
	        		base.$toolbar.fadeTo(150, 1);
		        	base.$view.val('0');
	        	}
	        } else if(data.popup) {	
	        	base.popupCommand(data.popup, data.button, data.command, base);
	        } else base.execCommand(base, data.command, data.value, data.useCSS, data.button);
	        base.$iframe.focus();
        };
        
        base.execCommand = function(editor, command, value) {
        	if (base.$view.val() == '0') {
	        	try {
	                success = editor.$doc[0].execCommand(command, false, value || false);
	            } catch (err) {
	                console.log(err);
	            }
	            if (!success) {
	            	if ("cutcopypaste".indexOf(command) > -1)
	                    alert('It would seem that ' + command + 'command is disabled for security reasons. Use the keyboard shortcut or context menu instead.');
	            }
        	}
        	base.updateEditor(editor);
        };
        
        base.popupCommand = function(type, sender, command, editor) {
        	if (base.$view.val() == '0') {
        		if (base.$popup.css('display') == 'none') {
	        		var position = $(sender).position();
	        		position.top += 26;
		        	base.$popup.css({ 'top': position.top, 'left': position.left });
		        	base.$popup.width('auto');
		        	
		        	if (type == 'url') {
		        		base.$popup.html('<strong>Insert URL</strong><br /><input type="text" size="20" /><br /><input type="button" value="Insert" />');
		        		base.$popup.children('input[type="button"]').click(function() { base.$popup.fadeOut(); base.popupClick(base, command, base.$popup.children('input[type="text"]').val()) });
		        	} else if (type == 'img') {
		        		base.$popup.html('<strong>Insert URL of image</strong><br /><input type="text" size="20" /><br /><input type="button" value="Insert" />');
		        		base.$popup.children('input[type="button"]').click(function() { base.$popup.fadeOut(); base.popupClick(base, command, base.$popup.children('input[type="text"]').val()) });
		        	} else if (type == 'color') {
		        		base.$popup.width(96);
		        		var colors = base.options.colors.split(" ");
		        		if (colors.length < 10) base.$popup.width("auto");
		        		$.each(colors, function (idx, color) {
		                    $('<div>').appendTo(base.$popup).addClass(EDITOR_CLASS + '-popup-color').css('background-color', "#" + color);
		                });
		        		base.$popup.children('.' + EDITOR_CLASS + '-popup-color').click(function() { base.$popup.fadeOut(); base.popupClick(base, command, $(this).css('background-color')); });
		        	} else if (type == 'format') {
		        		for (i = 1; i < 7; i++) {
		        			$('<h' + i + ' class="h' + i + '">Heading ' + i + '</h' + i + '>').click(function() { base.$popup.fadeOut(); base.popupClick(base, command, $(this).attr('class').substr(0, 2)); }).addClass(EDITOR_CLASS + '-popup-format').appendTo(base.$popup);
		        		}
		        	} else if (type == 'size') {
		        		var sizes = base.options.sizes.split(",");
		        		$.each(sizes, function (idx, size) {
		                    $('<span>Font ' + size + '</span><br />').appendTo(base.$popup).addClass(EDITOR_CLASS + '-popup-size').css('font-size', size + 'px');
		                });
		        		base.$popup.children('.' + EDITOR_CLASS + '-popup-size').click(function() { base.$popup.fadeOut(); base.popupClick(base, command, $(this).css('font-size')); });
		        	} else {
		        		
		        	}
		        	base.$popup.fadeIn();
        		} else {
        			base.$popup.fadeOut(150, function() { $(this).html('') });
        		}
        	}
        };
        
        base.popupClick = function(editor, command, value) {
        	if (command == 'insertImage' && $.browser.mozilla) {
        		base.execCommand(editor, 'enableObjectResizing');
        		base.execCommand(editor, command, value);
        	} else {
        		base.execCommand(editor, command, value);
        	}
        };
        
        base.updateEditor = function() {
        	var xhtml = base.$iframe.contents().find('body').html();
        	xhtml
        	.replace(/<i>(.*?)<\/i>/g, '<em>$1</em>')
        	.replace(/<b>(.*?)<\/b>/g, '<strong>$1</strong>')
        	.replace(/<(area|base|basefont|br|col|frame|hr|img|input|isindex|link|meta|param|embed)(.*?)[^ \/]>/igm, '<$1$2 />');
        	
        	base.$el.val(xhtml);
        };
        
        base.updateFrame = function() {
        	base.$iframe.contents().find('body').html(base.$el.val());
        };

        // Run initializer
        base.init();
    };
    
    $.rte.defaultOptions = {
        width: 650,
        height: 250,
        controls: 'bold italic underline strikethrough | format fontsize color hilite | alignleft center alignright justify | bullets numbering | image link unlink | undo redo | cut copy paste | html',
        commands: 'bold,Bold (Ctrl/Cmd + B),|italic,Italic (Ctrl/Cmd + I),|underline,Underline (Ctrl/Cmd + U),|strikethrough,,|' +
        		  'subscript,,|superscript,,|' +
        		  'color,Font Color,forecolor,color|hilite,Text Highlight Color,hilitecolor,color|backcolor,Background color,,color|' +
        		  'format,Format block,formatBlock,format|fontsize,Change text size,fontsize,size|' +
        		  'alignleft,Align Left,justifyleft|center,Centered,justifycenter|alignright,Align Right,justifyright|justify,Justified,justifyfull|' +
        		  'bullets,Unordered list,insertunorderedlist|numbering,Ordered list,insertorderedlist|' +
        		  'image,Insert Image,insertimage,img|link,Insert Link,createlink,url|unlink,Remove Link,|' +
        		  'undo,Undo (Ctrl/Cmd + Z),|redo,Redo (Ctrl/Cmd + Y)|' +
        		  'cut,Cut (Ctrl/Cmd + X),|copy,Copy (Ctrl/Cmd + C),|paste,Paste (Ctrl/Cmd + V),|' +
        		  'html,Show source',
        colors: 'FFF CCC 999 666 333 000 ' +
        		'F00 E00 C00 900 600 300 ' +
        		'0F0 0E0 0C0 090 060 030 ' +
        		'00F 00E 00C 009 006 003',
        fonts: "Helvetica,Arial,Arial Black,Tahoma,Courier New,Verdana",
        sizes: "9,10,11,12,14,16,18",
        useCSS: false,
        
        frameDoc: '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">',
        frameCSS: '',
        frameBody: 'margin:6px; font:10pt Arial,Verdana; cursor:text;'
    };
    
    $.fn.rte = function(options) {
        return this.each(function() {
            (new $.rte(this, options));
        });
    };
    
})(jQuery);