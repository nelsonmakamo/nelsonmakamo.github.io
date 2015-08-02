/*jslint devel: true, browser: true, unparam: true, debug: false, es5: true, white: false, maxerr: 1000 */
/**!
 * FooBox - A jQuery plugin for responsive lightboxes
 * @version 2.1.2
 * @link http://fooplugins.com/plugins/foobox-jquery
 * @copyright Steven Usher & Brad Vincent 2014
 * @license Released under the MIT license.
 * You are free to use FooBox jQuery in personal projects as long as this copyright header is left intact.
 */
(function ($, window, console, undefined) {
	if (!$ || !window) { return; } // if jquery or no window object exists exit

	/** @namespace - Contains all the core objects and logic for the FooBox plugin. */
	window.FooBox = {
		/** @type {Object} - An object containing all the default option values. */
		defaults: {
			/** @type {Object} - An object containing affiliate related options. */
			affiliate: {
				/** @type {boolean} - A Boolean indicating whether or not to enable the affiliate link for FooBox. */
				enabled: true,
				/** @type {string} - A String to use as the prefix for the affiliate link. */
				prefix: 'Powered by ',
				/** @type {string} - A String containing the affiliate URL. */
				url: 'http://fooplugins.com/plugins/foobox/'
			},
			/** @type {boolean} - A Boolean indicating whether or not to always init the plugin instead of using reinit. */
			alwaysInit: false,
			/** @type {boolean} - A Boolean indicating whether or not to close FooBox when the overlay is clicked. */
			closeOnOverlayClick: true,
			/** @type {string} - A String used as a class name that will be added to every instance of FooBox that is created */
			containerCssClass: 'fbx-instance',
			/** @type {string} - A String used to format the image counter. The tokens "%index" and "%total" will be used to substitute the current values. */
			countMessage: 'item %index of %total',
			/** @type {string} -  */
			error: 'Could not load the item',
			/** @type {string} - A Selector used to further filter the elements found by the selector option. */
			excludes: '.fbx-link, .nofoobox',
			/** @type {string} - A Selector used to find elements that need to open FooBox instances, these elements can be placed any where in the DOM as long as they contain a data-foobox attribute with a valid selector. */
			externalSelector: 'a[data-foobox],input[data-foobox]',
			/** @type {boolean} - A Boolean indicating whether or not images are scaled up to fit to the screen size (this could look awkward when set to true with low resolution images). */
			fitToScreen: false,
			/** @type {boolean} - A Boolean indicating whether or not to hide the default browser scroll bars when FooBox is visible. */
			hideScrollbars: true,
			/** @type {number} - A Number determining the amount of milliseconds to add to each item. This is primarily used only in development however it is exposed as an option that you can adjust. */
			loadDelay: 0,
			/** @type {number} - A Number determining the minimum amount of milliseconds before the loader is displayed. If an item takes longer than X milliseconds to load then the loader will be shown. */
			loaderTimeout: 600,
			/** @type {string} - One or more space-separated classes to be added to the class attribute of the FooBox modal element. */
			modalClass: '',
			/** @type {boolean} -  */
			preload: false,
			/** @type {string} - The rel attribute String value used during the initialization of a FooBox to find any additional elements to include in the current instance. */
			rel: null,
			/** @type {number} -  */
			resizeSpeed: 300,
			/** @type {string} - A Selector used to match an item to display in FooBox. */
			selector: 'a',
			/** @type {boolean} - A Boolean indicating whether or not to show the previous and next buttons. */
			showButtons: true,
			/** @type {boolean} - A Boolean indicating whether or not to show the countMessage in FooBox. */
			showCount: true,
			/** @type {string} - The FooBox style class to use. */
			style: 'fbx-rounded',
			/** @type {string} - The FooBox theme class to use. */
			theme: 'fbx-light',
			/** @type {number} - A Number determining the amount of milliseconds the transition in animation takes to complete. */
			transitionInSpeed: 200,
			/** @type {number} - A Number determining the amount of milliseconds the transition out animation takes to complete. */
			transitionOutSpeed: 200,
			/** @type {function} - A callback function that is called after foobox is initialized. */
			initCallback: null,
			/** @type {boolean} - Whether or not to allow the looping of images using the previous and next buttons. */
			loop: true
		},
		/** @type {string} - The current version of FooBox. */
		version: '2.0.10',
		/** @type {Array} - An array containing all instances of FooBox for the page. */
		instances: [],
		/**
		 * Small ready function to circumvent external errors blocking jQuery's ready.
		 * @param {Function} func - The function to call when the document is ready.
		 * @see http://www.dustindiaz.com/smallest-domready-ever
		 */
		ready: function (func) {
			/in/.test(document.readyState) ? setTimeout('FooBox.ready(' + func + ')', 9) : func()
		}
	};

	/**
	 * Imitates .NET's String.format method, arguments that are not strings will be auto-converted to strings.
	 * @param {string} formatString - The format string to use.
	 * @param {*} arg1 - An argument to format the string with.
	 * @param {*} argN - Additional arguments to format the string with.
	 * @returns {string}
	 */
	FooBox.format = function (formatString, arg1, argN) {
		var s = arguments[0], i, reg;
		for (i = 0; i < arguments.length - 1; i++) {
			reg = new RegExp("\\{" + i + "\\}", "gm");
			s = s.replace(reg, arguments[i + 1]);
		}
		return s;
	};

	/** @namespace - Contains logic to determine the browser. */
	FooBox.browser = {
		/** @type {boolean} - A Boolean indicating whether or not the current browser is Internet Explorer. */
		isIE: false,
		/** @type {boolean} - A Boolean indicating whether or not the current browser is Chrome. */
		isChrome: false,
		/** @type {boolean} - A Boolean indicating whether or not the current browser is Safari. */
		isSafari: false,
		/** @type {number} - A Number indicating the current Internet Explorer browser version. */
		version: 0,
		/** @type {string} - A String containing classes to be appended to the modal depending on the browser. */
		css: '',
		/** @type {boolean} - A boolean indicating whether or not we are on an iOS device. */
		iOS: false,
		/** @type {boolean} - A boolean indicating whether or not we are on a Mac device. */
		Mac: false,
		/** @type {boolean} - A boolean indicating whether or not we are on a mobile device. */
		isMobile: (function(a){
			return (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)
			||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)));
		})(navigator.userAgent||navigator.vendor||window.opera),
		/**
		 * Checks the browser vendor and version and sets certain flags and classes if it's Internet Explorer.
		 */
		check: function () {
			FooBox.browser.isIE = navigator.appVersion.indexOf("MSIE") > -1;
			FooBox.browser.isChrome = navigator.appVersion.indexOf("Chrome") > -1 || navigator.appVersion.indexOf("CriOS") > -1;
			FooBox.browser.isSafari = navigator.appVersion.indexOf("Safari") > -1 && !FooBox.browser.isChrome;
			FooBox.browser.iOS = /(iPad|iPhone|iPod)/g.test(navigator.platform);
			FooBox.browser.Mac = /(Mac)/g.test(navigator.platform);
			if (FooBox.browser.iOS == true) {
				FooBox.browser.css += ' fbx-ios';
			}
			if (FooBox.browser.Mac == true) {
				FooBox.browser.css += ' fbx-mac';
			}
			if (FooBox.browser.isSafari) {
				FooBox.browser.css += ' fbx-safari';
			}
			if (FooBox.browser.isChrome){
				FooBox.browser.css += ' fbx-chrome';
			}
			if (FooBox.browser.isIE) {
				FooBox.browser.css = FooBox.format('fbx-ie fbx-ie{0}', parseFloat(navigator.appVersion.split("MSIE")[1]));
			}
		},
		/**
		 * Checks if the current browser supports CSS3 transitions.
		 * @returns {boolean} - True if the browser supports CSS3 transitions.
		 */
		supportsTransitions: function() {
			var b = document.body || document.documentElement;
			var s = b.style;
			var p = 'transition', v;
			if(typeof s[p] == 'string') {return true; }

			// Tests for vendor specific prop
			v = ['Moz', 'Webkit', 'Khtml', 'O', 'ms'];
			p = p.charAt(0).toUpperCase() + p.substr(1);
			for(var i=0; i<v.length; i++) {
				if(typeof s[v[i] + p] == 'string') { return true; }
			}
			return false;
		},
		/**
		 * Retrieves the correct transitionend event to use for the current browser.
		 * @returns {(string|null)}
		 */
		transitionEnd: function(){
			var t;
			var el = document.createElement('fakeelement');
			var transitions = {
					'transition':'transitionend',
					'OTransition':'oTransitionEnd',
					'MozTransition':'transitionend',
					'WebkitTransition':'webkitTransitionEnd'
			};

			for(t in transitions){
				if (!transitions.hasOwnProperty(t)) { continue; }
				if( el.style[t] !== undefined ){
						return transitions[t];
					}
			}
			return null;
		}
	};
	FooBox.browser.check();

	/**
	 * Takes the supplied URL (partial or full) an returns a fully qualified url for it.
	 * @param {string} url - The url to fully qualify.
	 * @returns {string}
	 */
	FooBox.qualifiedURL = function(url){
		var a = document.createElement('a');
		a.href = url;
		return a.href;
	};

	///#DEBUG
	if (!console) { console = {}; }
	console.log = console.log || function () { };
	console.warn = console.warn || function () { };
	console.error = console.error || function () { };
	console.info = console.info || function () { };

	var Debug = {
		write: function () {
			console.log(FooBox.format.apply(Debug, arguments));
		},
		error: function () {
			if (arguments.length === 1 && arguments[0] instanceof Error) {
				console.error(arguments[0]);
			} else {
				console.error(FooBox.format.apply(Debug, arguments));
			}
		}
	};
	///#ENDDEBUG

	/**
	 * Augmented jQuery.Event object containing additional FooBox properties.
	 * @type {{instance: null, modal: null, options: null, handled: null}}
	 */
	jQuery.Event.prototype.fb = {
		/** @type {FooBox.Instance} instance - The instance of FooBox that raised this event. */
		instance: null,
		/** @type {FooBox.Modal} modal - The jQuery element for the current FooBox modal. */
		modal: null,
		/** @type {Object} options - The options for the current FooBox instance. */
		options: null
	};

	/**
	 * Raises an event on the given instance of FooBox appending the args to the event.fb namespace.
	 * @param {FooBox.Instance} instance - The instance of FooBox to raise the event on.
	 * @param {string} event - The name of the event to raise, this can include namespaces.
	 * @param {Object} [args] - An object containing additional values to be merged into the event.fb namespace.
	 * @returns {jQuery.Event} - The jQuery.Event object used to raise the event.
	 */
	FooBox.raise = function (instance, event, args) {
		args = args || {};
		var e = $.Event(event);
		e.fb = {};
		e.fb.instance = instance;
		e.fb.modal = instance.modal.element;
		e.fb.options = instance.options;
		$.extend(true, e.fb, args);
		instance.element.one(event,function (e) {e.stopPropagation();}).trigger(e);
		return e;
	};

	/**
	 * This small helper function was created due to the instanceof method of checking an object failing on 1 particular site....
	 * @param {Object} obj - The object to check if it's a jQuery object.
	 * @returns {boolean}
	 */
	FooBox.isjQuery = function(obj){
		return (obj instanceof jQuery) ? true : (obj && obj.jquery);
	};

	/** @namespace - Common logic for merging objects and getting and setting there values. */
	FooBox.options = {
		/**
		 * Determine whether or not the specified name is a multipart property name, basically just checking if the name contains the separator.
		 * @param {string} name - The name to check is multipart.
		 * @param {string} separator - The separator used to determine multiple parts.
		 * @returns {boolean} - True if the name contains the separator.
		 */
		isMultipart: function (name, separator) {
			return typeof name === 'string' && name.length > 0 && name.indexOf(separator) !== -1;
		},
		/**
		 * Checks if the supplied obj has any of its own properties, i.e. non inherited properties.
		 * @param {Object} obj - The object to check for non-inherited properties.
		 * @returns {boolean} - True if the obj has its own non-inherited properties.
		 */
		hasProperties: function (obj) {
			if (typeof obj !== 'object') { return false; }
			var prop;
			for (prop in obj) {
				if (obj.hasOwnProperty(prop)) {
					return true;
				}
			}
			return false;
		},
		/**
		 * Gets the value of the property specified by the name from the supplied obj.
		 * @param {Object} obj - The object to retrieve the property value from.
		 * @param {string} name - The name of the property to get. Child properties are delimited with a period [.]
		 * @returns {*} - The value of the property retrieved.
		 */
		get: function (obj, name) {
			if (FooBox.options.isMultipart(name, '.')) {
				var propName = name.substring(0, name.indexOf('.'));
				var remainder = name.substring(name.indexOf('.') + 1);
				obj[propName] = obj[propName] || {};
				return FooBox.options.get(obj[propName], remainder);
			}
			return obj[name];
		},
		/**
		 * Sets the value of the property specified by the name on the supplied obj.
		 * @param {Object} obj - The object to set the property value on.
		 * @param {string} name - The name of the property to set. Child properties are delimited with a period [.]
		 * @param {*} value - The value to set the property to.
		 */
		set: function (obj, name, value) {
			if (FooBox.options.isMultipart(name, '.')) {
				var propName = name.substring(0, name.indexOf('.'));
				var remainder = name.substring(name.indexOf('.') + 1);
				obj[propName] = obj[propName] || {};
				FooBox.options.set(obj[propName], remainder, value);
			} else {
				obj[name] = value;
			}
		},
		/**
		 * Wrote this as jQuery.extend merges arrays by index rather than overwriting them. This will not merge nested arrays.
		 * @param {Object} base - An object that will receive the new properties if additional objects are passed in.
		 * @param {Object} object1 - An object containing additional properties to merge in.
		 * @param {Object} [objectN] - Additional objects containing properties to merge in.
		 * @returns {Object} - The modified base object is returned.
		 */
		merge: function (base, object1, objectN) {
			var args = Array.prototype.slice.call(arguments), i;
			base = args.shift();
			object1 = args.shift();

			FooBox.options._merge(base, object1);
			for (i = 0; i < args.length; i++) {
				objectN = args[i];
				FooBox.options._merge(base, objectN);
			}

			return base;
		},
		/** @private */
		_merge: function (base, changes) {
			var prop;
			for (prop in changes) {
				if (changes.hasOwnProperty(prop)) {
					if (FooBox.options.hasProperties(changes[prop]) && !$.isArray(changes[prop])) {
						base[prop] = base[prop] || {};
						FooBox.options._merge(base[prop], changes[prop]);
					} else if ($.isArray(changes[prop])) {
						base[prop] = [];
						$.extend(true, base[prop], changes[prop]);
					} else {
						base[prop] = changes[prop];
					}
				}
			}
		}
	};

	/** @namespace - All the core logic for loading and managing objects is contained here. */
	FooBox.objects = {
		/** @type {Object} - An object containing all registered object arrays. */
		registered: {},
		ensure: function(name){
			return FooBox.objects.registered[name] = FooBox.objects.registered[name] || [];
		},
		/**
		 * Registers an obj and its default options with FooBox.
		 * @param {string} name - The name of the collection to register the obj under.
		 * @param {function} obj - The obj to register.
		 * @param {Object} [defaults] - The default options to merge with the FooBox's default options.
		 * @returns {boolean} - True if the addon is registered.
		 */
		register: function (name, obj, defaults) {
			var arr = FooBox.objects.ensure(name);
			arr.push(obj);
			if (typeof defaults === 'object') { $.extend(true, FooBox.defaults, defaults); }
			return true;
		},
		/**
		 * Loops through the specified registered objects and inits new instances for the supplied FooBox.
		 * @param {string} name - The name of the collection to register the obj under.
		 * @param {FooBox.Instance} instance - The instance of FooBox to load objects for.
		 * @returns {Array} - An array containing all the loaded objects for the instance.
		 */
		load: function (name, instance) {
			var loaded = [], registered, i, arr = FooBox.objects.ensure(name);
			for (i = 0; i < arr.length; i++) {
				try {
					registered = arr[i];
					loaded.push(new registered(instance));
				} catch (err) {
					Debug.error(err);
				}
			}
			instance.objects = instance.objects || {};
			instance.objects[name] = loaded;
		},
		/**
		 * Loops through the specified registered objects for the FooBox instance and calls the method passing in any additional arguments.
		 * @param {string} name - The name of the collection to register the obj under.
		 * @param {FooBox.Instance} instance - The instance of FooBox to call the method on.
		 * @param {string} method - The method to call.
		 * @param {*} [arg1] - An optional argument to pass through to the method.
		 * @param {*} [argN] - Additional optional arguments.
		 */
		call: function (name, instance, method, arg1, argN) {
			var args = Array.prototype.slice.call(arguments), obj;
			name = args.shift();
			instance = args.shift();
			method = args.shift();

			var arr = instance.objects[name] || [];
			for (var i = 0; i < arr.length; i++) {
				try {
					obj = arr[i];
					if (!$.isFunction(obj[method])) { continue; }
					obj[method].apply(obj, args);
				} catch (err) {
					Debug.error(err);
				}
			}
		},
		/**
		 * Retrieves an instance of an object from the supplied FooBox by type.
		 * @param {string} name - The name of the collection to get the obj from.
		 * @param {FooBox.Instance} instance - The instance of FooBox to retrieve the handler from.
		 * @param {function} where - The function to use to find the object to retrieve. The first parameter passed is the current iterated item.
		 * @returns {Object}
		 */
		get: function (name, instance, where) {
			var i, arr = instance.objects[name];
			if (!arr || !$.isFunction(where)) { return null; }
			for (i = 0; i < arr.length; i++) {
				if (where(arr[i])) {
					return arr[i];
				}
			}
			return null;
		}
	};

	/** @namespace - The code for loading and managing addons is contained here. */
	FooBox.addons = {
		_ns: 'addons',
		/**
		 * Simple validation of the addon to make sure any members called by FooBox actually exist.
		 * @param {function} obj - The function containing the addon logic.
		 * @returns {boolean} - True if the addon is valid.
		 */
		validate: function (obj) {
			if (!$.isFunction(obj)) {
				Debug.error('Expected type "function", received type "{0}".', typeof obj);
				return false;
			}
			return true;
		},
		register: function(obj, defaults){
			if (!FooBox.addons.validate(obj)) {
				Debug.error('Failed to register the addon.');
				return false;
			}
			return FooBox.objects.register(FooBox.addons._ns, obj, defaults);
		},
		load: function(instance){
			FooBox.objects.load(FooBox.addons._ns, instance);
		},
		call: function(instance, method, arg1, argN){
			var args = Array.prototype.slice.call(arguments);
			args.unshift(FooBox.addons._ns);
			FooBox.objects.call.apply(this, args);
		}
	};

	/** @namespace - The code for loading and managing handlers is contained here. */
	FooBox.handlers = {
		_ns: 'handlers',
		/**
		 * Simple validation of the handler to make sure any members called by FooBox actually exist.
		 * @param {function} obj - The function containing the handler logic.
		 * @returns {boolean} - True if the handler is valid.
		 */
		validate: function (obj) {
			if (!$.isFunction(obj)) {
				Debug.error('Expected type "function", received type "{0}".', typeof obj);
				return false;
			}
			var test = new obj();
			if (!$.isFunction(test.handles)) {
				Debug.error('The required "handles" method is not implemented.');
				return false;
			}
			if (!$.isFunction(test.defaults)) {
				Debug.error('The required "defaults" method is not implemented.');
				return false;
			}
			if (!$.isFunction(test.parse)) {
				Debug.error('The required "parse" method is not implemented.');
				return false;
			}
			if (!$.isFunction(test.load)) {
				Debug.error('The required "load" method is not implemented.');
				return false;
			}
			if (!$.isFunction(test.getSize)) {
				Debug.error('The required "getSize" method is not implemented.');
				return false;
			}
			if (!$.isFunction(test.hasChanged)) {
				Debug.error('The required "hasChanged" method is not implemented.');
				return false;
			}
			if (!$.isFunction(test.preload)) {
				Debug.error('The required "preload" method is not implemented.');
				return false;
			}
			return true;
		},
		/**
		 * Registers a handler and its default options with FooBox.
		 * @param {function} obj - The handler to register.
		 * @param {Object} [defaults] - The default options to merge with the FooBox's defaults.
		 * @returns {boolean} - True if the handler is registered.
		 */
		register: function(obj, defaults){
			if (!FooBox.handlers.validate(obj)) {
				Debug.error('Failed to register the handler.');
				return false;
			}
			return FooBox.objects.register(FooBox.handlers._ns, obj, defaults);
		},
		/**
		 * Loops through all registered handlers and initializes new instances for the supplied FooBox.
		 * @param {FooBox.Instance} instance - The instance of FooBox to load handlers for.
		 */
		load: function(instance){
			FooBox.objects.load(FooBox.handlers._ns, instance);
		},
		/**
		 * Loops through all handlers for the FooBox instance and calls the method passing in any additional arguments.
		 * @param {FooBox.Instance} instance - The instance of FooBox to call the handler method on.
		 * @param {string} method - The method to call on the handlers.
		 * @param {*} [arg1] - An optional argument to pass through to the method.
		 * @param {*} [argN] - Additional optional arguments.
		 */
		call: function(instance, method, arg1, argN){
			var args = Array.prototype.slice.call(arguments);
			args.unshift(FooBox.handlers._ns);
			FooBox.objects.call.apply(this, args);
		},
		/**
		 * Retrieves an instance of a handler from the supplied FooBox by type.
		 * @param {FooBox.Instance} instance - The instance of FooBox to retrieve the handler from.
		 * @param {string} type - The type to retrieve.
		 * @returns {Object}
		 */
		get: function (instance, type) {
			return FooBox.objects.get(FooBox.handlers._ns, instance, function(item){ return item.type == type; });
		}
	};

	/**
	 * A item object used by FooBox.
	 * @param {string} type - The type of item.
	 * @param {(jQuery|HTMLElement)} element - The jQuery or DOM element the item is based on.
	 * @param {Object} handler - The handler for the item, this should match the type.
	 * @returns {FooBox.Item}
	 * @constructor
	 */
	FooBox.Item = function (type, element, handler) {
		/** @type {string} - The type of item. */
		this.type = type;
		/** @type {jQuery} - The jQuery or DOM element the item is based on. */
		this.element = FooBox.isjQuery(element) ? element : $(element);
		/** @type {Object} - The handler for the item, this should match the type. */
		this.handler = handler;
		/** @type {number} - The width of this item in pixels. */
		this.width = null;
		/** @type {number} - The height of this item in pixels. */
		this.height = null;
		/** @type {string} - The url of item. */
		this.url = null;
		/** @type {boolean} - Whether or not this item will overflow it's content when it is to big to be displayed. */
		this.overflow = false;
		/** @type {boolean} - Whether or not this item has been preloaded. */
		this.preloaded = false;
		/** @type {boolean} - Whether or not this item will maintain it's proportion when being resized. */
		this.proportion = false;
		/** @type {boolean} - Whether or not this item is an error item. */
		this.error = false;
		return this;
	};

	/**
	 * A simple size object used by FooBox.
	 * @param {number} width
	 * @param {number} height
	 * @returns {FooBox.Size}
	 * @constructor
	 */
	FooBox.Size = function (width, height) {
		/** @type {number} - The width of this size object. */
		this.width = (typeof width === "number") ? width : parseInt(width, 0);
		/** @type {number} - The height of this size object. */
		this.height = (typeof height === "number") ? height : parseInt(height, 0);
		/**
		 * Checks if this size is equal to the provided size.
		 * @param {FooBox.Size} size - The size to compare.
		 * @returns {boolean}
		 */
		this.equalTo = function(size){
			return this.width == size.width && this.height == size.height;
		};
		return this;
	};

	/**
	 * A simple timer object created around setTimeout that is used by FooBox.
	 * @returns {FooBox.Timer}
	 * @constructor
	 */
	FooBox.Timer = function () {
		/** @type {number} - The id returned by the setTimeout function. */
		this.id = null;
		/** @type {boolean} - Whether or not the timer is currently counting down. */
		this.busy = false;

		/**
		 * @type {FooBox.Timer} - Hold a reference to this instance of the object to avoid scoping issues.
		 * @private
		 */
		var _this = this;

		/**
		 * Starts the timer and waits the specified amount of milliseconds before executing the supplied function.
		 * @param {function} func - The function to execute once the timer runs out.
		 * @param {number} milliseconds - The time in milliseconds to wait before executing the supplied function.
		 * @param {*} [thisArg] - The value of this within the scope of the function.
		 */
		this.start = function (func, milliseconds, thisArg) {
			thisArg = thisArg || func;
			_this.stop();
			_this.id = setTimeout(function () {
				func.call(thisArg);
				_this.id = null;
				_this.busy = false;
			}, milliseconds);
			_this.busy = true;
		};

		/**
		 * Stops the timer if its running and resets it back to its starting state.
		 */
		this.stop = function () {
			if (_this.id === null || _this.busy === false) { return; }
			clearTimeout(_this.id);
			_this.id = null;
			_this.busy = false;
		};

		return this;
	};

	/**
	 * Registers FooBox with jQuery. When used FooBox is initialized on the selected objects using the optional arguments.
	 * @returns {jQuery}
	 */
	$.fn.foobox = function (options) {
		options = options || {};
		return this.each(function () {
			var fbx = $(this).data('fbx_instance');
			if (fbx instanceof FooBox.Instance) {
				if (fbx.options.alwaysInit == true){
					var opts = fbx.options;
					fbx.destroy();
					fbx = new FooBox.Instance(fbx.id);
					fbx.init(this, $.extend(true, opts, options));
				} else {
					fbx.reinit(options); // Otherwise reinitialize the plugin using the new options
				}
			} else {
				// If this is already an item in another FooBox ignore it.
				fbx = $(this).data('fbx_p_instance');
				if (fbx instanceof FooBox.Instance){ return; }
				// init a new instance if one doesn't exist
				fbx = new FooBox.Instance();
				fbx.init(this, options);
			}
		});
	};

	/**
	 * The core Foobox Modal logic.
	 * @param {FooBox.Instance} instance - The parent FooBox instance for this modal.
	 * @returns {FooBox.Modal}
	 * @constructor
	 */
	FooBox.Modal = function (instance) {
		/** @type {FooBox.Instance} - The parent FooBox instance for this modal. */
		this.FooBox = instance;
		/** @type {jQuery} - The jQuery object for the modal. */
		this.element = null;
		/** @type {FooBox.Timer} - A timer object used by the loader. */
		this.loaderTimeout = new FooBox.Timer();
		/** @type {boolean} - Whether or not the current item is the first item shown by this modal. This is reset on close. */
		this._first = false;

		this._busy = false;

		this._closed = false;

		/**
		 * @type {FooBox.Modal} - Hold a reference to this instance of the object to avoid scoping issues.
		 * @private
		 */
		var _this = this;

		/**
		 * Initializes this instance of the Modal object using the supplied element and options.
		 * @param {(jQuery|HTMLElement)} element - The jQuery or DOM element the FooBox was initialized on.
		 * @param {Object} options - The options supplied when the FooBox was initialized.
		 */
		this.init = function (element, options) {
			_this.setup.html();
			_this.setup.options(options);
			_this.setup.bind();
		};

		/**
		 * Reinitializes this instance of the Modal object using the supplied options.
		 * @param {Object} options - The options supplied when the FooBox was reinitialized.
		 */
		this.reinit = function (options) {
			_this.setup.options(options);
		};

		/**
		 * Destroys this instance of the modal object.
		 */
		this.destroy = function(){
			if (FooBox.isjQuery(_this.element)){
				_this.element.remove();
			}
		};

		/** @namespace - Contains the logic used for initialization and reinitialization. */
		this.setup = {
			/**
			 * Generates the base HTML used to construct the FooBox modal if it doesn't already exist.
			 */
			html: function () {
				if (FooBox.isjQuery(_this.element)){ return; }

				_this.element = $('<div class="fbx-modal"></div>');
				_this.element.append('<div class="fbx-inner-spacer"></div>');

				var $stage = $('<div class="fbx-stage"></div>');
				$stage.append('<div class="fbx-item-current"></div>');
				$stage.append('<div class="fbx-item-next"></div>');

				var $inner = $('<div class="fbx-inner fbx-inner-shadow"></div>');
				$inner.append($stage);

				$inner.append('<a href="#prev" class="fbx-prev fbx-btn-transition fbx-btn-shadow"></a>');

				$inner.append('<div class="fbx-credit"><a target="_blank" href=""><em></em><span> FooBox</span></a></div>');
				$inner.append('<span class="fbx-count" />');
				$inner.append('<a href="#next" class="fbx-next fbx-btn-transition fbx-btn-shadow"></a>');
				$inner.append('<a href="#close" class="fbx-close fbx-btn-transition fbx-btn-shadow"></a>');

				_this.element.append('<div class="fbx-loader"><div></div></div>');
				_this.element.append($inner);

				_this.FooBox.raise('foobox.setupHtml');

				$('body').append(_this.element);
			},
			/**
			 * Applies the initial state for FooBox using the supplied options.
			 * @param {Object} options - The options supplied when FooBox was initialized.
			 */
			options: function (options) {
				var display;
				_this.element.removeClass()
					.addClass('fbx-modal')
					.addClass(FooBox.format('fbx-{0}', _this.FooBox.id))
					.addClass(_this.FooBox.element.data('style') || options.style)
					.addClass(_this.FooBox.element.data('theme') || options.theme)
					.addClass(_this.FooBox.element.data('modal-class'))
					.addClass(options.modalClass)
					.data('fbx_instance', _this.FooBox);

				_this.element.addClass(FooBox.browser.css);

				display = options.affiliate.enabled ? '' : 'none';
				_this.element.find('.fbx-credit').css('display', display);
				if (options.affiliate.enabled) {
					_this.element.find('.fbx-credit > a').attr('href', options.affiliate.url);
					_this.element.find('.fbx-credit > a > em').text(options.affiliate.prefix);
				}

				display = options.showCount && _this.FooBox.items.multiple() ? '' : 'none';
				_this.element.find('.fbx-count').css('display', display);

				if (!options.showButtons || !_this.FooBox.items.multiple()){
					_this.element.addClass('fbx-no-buttons');
				}

				_this.FooBox.raise('foobox.setupOptions');
			},
			/**
			 * Binds any the events required for FooBox to function.
			 */
			bind: function () {
				//overlay click
				if (_this.FooBox.options.closeOnOverlayClick == true){
					_this.element.unbind('click.foobox')
						.bind('click.foobox', function (e) {
							// the option is checked as well as it can be disabled during run time.
							if (_this.FooBox.options.closeOnOverlayClick == true && $(e.target).is('.fbx-modal')) {
								_this.close();
							}
						});
				}
				//bind action buttons
				_this.element.find('.fbx-close').unbind('click.foobox')
					.bind('click.foobox',function (e) {
						e.preventDefault();
						e.stopPropagation();
						_this.close();
					}).end()
					.find('.fbx-prev').unbind('click.foobox')
					.bind('click.foobox',function (e) {
						e.preventDefault();
						e.stopPropagation();
						if ($(this).hasClass('fbx-disabled')) return;
						_this.prev();
					}).end()
					.find('.fbx-next').unbind('click.foobox')
					.bind('click.foobox', function (e) {
						e.preventDefault();
						e.stopPropagation();
						if ($(this).hasClass('fbx-disabled')) return;
						_this.next();
					});
			}
		};

		/**
		 * Small function to make this instance have the highest visibility priority. i.e. it will show above all others.
		 */
		this.prioritize = function () {
			if (FooBox.instances.length > 1) {
				_this.element.nextAll('.fbx-modal:last').after(_this.element);
			}
		};

		/**
		 * Attempts to preload the previous and next items if required.
		 */
		this.preload = function () {
			if (_this.FooBox.options.preload != true) { return; }
			var prev = _this.FooBox.items.prev();
			if (prev) prev.handler.preload(prev);
			var next = _this.FooBox.items.next();
			if (next) next.handler.preload(next);
		};

		/**
		 * The core function to the modal. This contains all the logic for displaying an item.
		 * @param {boolean} [first=false] - An optional parameter indicating whether or not this is the first item displayed by the modal.
		 */
		this.show = function (first) {
			first = first || false;

			_this._first = first;
			_this._busy = true;
			_this._closed = false;

			$('body').addClass('fbx-active');
			if (_this.FooBox.options.hideScrollbars) { $('body,html').css('overflow', 'hidden'); }

			var item = _this.FooBox.items.current();
			if (item.error == true) { _this.element.addClass('fbx-error'); }
			else { _this.element.removeClass('fbx-error'); }

			if (!_this.element.hasClass('fbx-show')) {
				_this.prioritize();
				_this.element.addClass('fbx-loading')
					.find('.fbx-inner')
					.css({ 'width': '100px', 'height': '100px', 'margin-top': '-50px', 'margin-left': '-50px' });
			}

			var current = _this.element.find('.fbx-item-current'),
				next = _this.element.find('.fbx-item-next');

			next.hide().css('opacity', '0');

			function handleError(err) {
				_this.loaderTimeout.stop();
				_this.element.removeClass('fbx-loading');

				_this._busy = false;
				Debug.error(err);
				if (_this.FooBox.raise('foobox.onError', { 'error': err }).isDefaultPrevented()) { return; }
				var error = _this.FooBox.items.error(item.index);
				if (error != null) { _this.show(first); }
			}

			_this.element.find('.fbx-count').text(_this.FooBox.options.countMessage.replace('%index', '' + (_this.FooBox.items.indexes.current + 1)).replace('%total', '' + _this.FooBox.items.array.length));

			if (_this.FooBox.raise('foobox.beforeLoad', { 'item': item }).isDefaultPrevented()) { _this._busy = false; return; }

			if (item.handler.hasChanged(item)) {
				var i = item.index, base = item.element.get(0);
				item = item.handler.parse(item.element);
				base.index = item.index = i;
				_this.FooBox.items.array[i] = item;
			}

			_this.preload();

			//start timer
			_this.loaderTimeout.start(function () {
				_this.element.addClass('fbx-loading');
			}, _this.FooBox.options.loaderTimeout);

			setTimeout(function () {
				_this.checkForLoop(item);
				//load the html into the next container
				item.handler.load(item, next, function (size) {
					if (_this._closed == true){ _this._busy = false; return; }
					_this.transitionOut(current, function () {
						if (_this._closed == true){ _this._busy = false; return; }
						_this.resize(size, function () {
							if (_this._closed == true){ _this._busy = false; return; }
							_this.loaderTimeout.stop();
							next.show();
							_this.transitionIn(next, function () {
								if (_this._closed == true){ _this._busy = false; return; }
								//do some final stuff
								next.add(current).toggleClass('fbx-item-next fbx-item-current');
								current.empty();
								if (!_this.element.hasClass('fbx-show')) {
									if (!_this.FooBox.raise('foobox.beforeShow', { 'item': item }).isDefaultPrevented()){
										_this.element.removeClass('fbx-loading').addClass('fbx-show');
										_this.FooBox.raise('foobox.afterShow', { 'item': item });
										_this.FooBox.raise('foobox.afterLoad', { 'item': item });
										_this._busy = false;
									}
								} else {
									_this.element.removeClass('fbx-loading');
									_this.FooBox.raise('foobox.afterLoad', { 'item': item });
									_this._busy = false;
								}
							}, handleError);

						}, handleError);

					}, handleError);

				}, handleError);

			}, _this.FooBox.options.loadDelay);
		};

		/**
		 * Checks the for the loop option and appends the fbx-disabled class to the previous or next buttons as required.
		 * @param {FooBox.Item} item - The item to be shown.
		 */
		this.checkForLoop = function(item){
			if (_this.FooBox.options.loop == true) return;
			_this.element.find('.fbx-prev, .fbx-next').removeClass('fbx-disabled');
			if (_this.FooBox.items.is.first(item)){
				_this.element.find('.fbx-prev').addClass('fbx-disabled');
			}
			if (_this.FooBox.items.is.last(item)){
				_this.element.find('.fbx-next').addClass('fbx-disabled');
			}
		};

		/**
		 * Resizes the inner modal to the maximum size of the viewport while keeping it in proportion.
		 * @param {FooBox.Size} size - The size to resize to.
		 * @param {function} [success] - The function to execute once the new size has been determined. The first parameter is the new size.
		 * @param {function} [error] - The function to execute if an error occurs while determining the new size. The first parameter is the error.
		 */
		this.resize = function (size, success, error) {
			try {
				if (size.width === 0 || size.height === 0) {
					if ($.isFunction(error)) { error(FooBox.format('Invalid size supplied. Width = {0}, Height = {1}', size.width, size.height)); }
					return;
				}
				var item = _this.FooBox.items.current(),
					$inner = _this.element.find('.fbx-inner'),
					$spacer = _this.element.find('.fbx-inner-spacer');

				// The variables used to determine the maximum size for the image.
				var mpt = parseInt($spacer.css('padding-top'), 0),
					mpb = parseInt($spacer.css('padding-bottom'), 0),
					mpl = parseInt($spacer.css('padding-left'), 0),
					mpr = parseInt($spacer.css('padding-right'), 0),
					ibt = parseInt($inner.css('border-top-width'), 0),
					ibb = parseInt($inner.css('border-bottom-width'), 0),
					ibl = parseInt($inner.css('border-left-width'), 0),
					ibr = parseInt($inner.css('border-right-width'), 0),
					padding = parseInt($inner.css('padding-left'), 0),
					vdiff = (mpt + mpb) + (padding * 2) + ibt + ibb,
					hdiff = mpl + mpr + (padding * 2) + ibl + ibr,
					cs = new FooBox.Size(parseInt($inner.css('width'), 0), parseInt($inner.css('height'), 0)),
					ms = new FooBox.Size(_this.element.width() - hdiff, _this.element.height() - vdiff),
					ratio = ms.width / size.width;

				// If this is a portrait calculate the ratio using the height variables instead of the width.
				if ((size.height * ratio) > ms.height) { ratio = ms.height / size.height; }

				// Calculate the size to scale the modal to if fitToScreen is set to true.
				if (_this.FooBox.options.fitToScreen === true || (item.proportion == true && (size.height > ms.height || size.width > ms.width))) {
					size.height = Math.floor(size.height * ratio);
					size.width = Math.floor(size.width * ratio);
				} else if (item.proportion == false){
					if (size.height > ms.height){ size.height = ms.height; }
					if (size.width > ms.width){ size.width = ms.width; }
				}

				// enforce min size requirements (this is so buttons etc don't look arb if the modal is sized to like 20x20)
				if (size.height < 100) { size.height = 100; }
				if (size.width < 100) { size.width = 100; }
				
				var mt = -((size.height / 2) + padding + ((ibt + ibb) / 2) + (mpb - mpt)),
					ml = -((size.width / 2) + padding + ((ibl + ibr) / 2));
				
				if (!cs.equalTo(size)) { // If the size has changed resize it.
					if (!_this.FooBox.raise('foobox.beforeResize', { 'item': item, 'size': size, 'offset': { 'top': mt, 'left': ml }, 'error': error, 'success': success }).isDefaultPrevented()){
						if (!_this.element.hasClass('fbx-show')) {
							$inner.css({ 'height': size.height, 'width': size.width, 'margin-top': mt, 'margin-left': ml });
							_this.overflow(item, size);
							_this.FooBox.raise('foobox.afterResize', { 'item': item, 'size': size });							
							if ($.isFunction(success)) { success(); }
						} else if (FooBox.browser.supportsTransitions()) {
							var speed = _this.FooBox.options.resizeSpeed / 1000, trans = 'all ' + speed + 's ease-in-out';
							$inner.css({
								WebkitTransition : trans,
								MozTransition    : trans,
								MsTransition     : trans,
								OTransition      : trans,
								transition       : trans
							});

							$inner.css({ 'height': size.height, 'width': size.width, 'margin-top': mt, 'margin-left': ml });
							setTimeout(function() {
								$inner.css({
									WebkitTransition : '',
									MozTransition    : '',
									MsTransition     : '',
									OTransition      : '',
									transition       : ''
								});
								_this.overflow(item, size);
								_this.FooBox.raise('foobox.afterResize', { 'item': item, 'size': size });
								if ($.isFunction(success)) { success(size); }
							}, _this.FooBox.options.resizeSpeed);
						} else {
							$inner.animate({ 'height': size.height, 'width': size.width, 'margin-top': mt, 'margin-left': ml }, _this.FooBox.options.resizeSpeed, function () {
								_this.overflow(item, size);
								_this.FooBox.raise('foobox.afterResize', { 'item': item, 'size': size });
								if ($.isFunction(success)) { success(size); }
							});
						}
					}
				} else {
					$inner.css({ 'height': size.height, 'width': size.width, 'margin-top': mt, 'margin-left': ml });
					_this.overflow(item, size);
					_this.FooBox.raise('foobox.afterResize', { 'item': item, 'size': size });							
					if ($.isFunction(success)) { success(); }
				}
			} catch (err) {
				if ($.isFunction(error)) { error(err); }
			}
		};

		/**
		 * Handles overflow for an item given the item and the current size.
		 * @param {FooBox.Item} item - The item being displayed.
		 * @param {FooBox.Size} size - The size for the item.
		 */
		this.overflow = function(item, size){
			if ((item.overflow == true && (size.width < (item.width * 0.8) || size.height < (item.height * 0.8)))
				|| (item.overflow == true && item.proportion == false && (size.width < item.width || size.height < item.height))) {
				_this.element.find('.fbx-item').css({ 'width': item.width, 'height': item.height, 'overflow': '' });
			} else {
				_this.element.find('.fbx-item').css({ 'width': '', 'height': '', 'overflow': 'hidden' });
			}
		};

		/**
		 * Transitions out the current item.
		 * @param {jQuery} current - The current jQuery object to transition out.
		 * @param {function} [success] - The function to execute once the transition is complete.
		 * @param {function} [error] - The function to execute if an error occurs while transitioning. The first parameter is the error.
		 */
		this.transitionOut = function (current, success, error) {
			try {
				if (!_this.element.hasClass('fbx-show')) {
					if ($.isFunction(success)) { success(); }
					return;
				}
				current.animate({ 'opacity': 0 }, current.is(':visible') ? _this.FooBox.options.transitionOutSpeed : 0, function () {
					if ($.isFunction(success)) { success(); }
				});
			} catch (err) {
				if ($.isFunction(error)) { error(err); }
			}
		};

		/**
		 * Transitions in the next item.
		 * @param {jQuery} next - The next jQuery object to transition in.
		 * @param {function} [success] - The function to execute once the transition is complete.
		 * @param {function} [error] - The function to execute if an error occurs while transitioning. The first parameter is the error.
		 */
		this.transitionIn = function (next, success, error) {
			try {
				if (!_this.element.hasClass('fbx-show')) {
					next.css({ 'opacity': 1 });
					if ($.isFunction(success)) { success(); }
					return;
				}
				next.animate({ 'opacity': 1 }, _this.FooBox.options.transitionInSpeed, function () {
					if ($.isFunction(success)) { success(); }
				});
			} catch (err) {
				if ($.isFunction(error)) { error(err); }
			}
		};

		/**
		 * Closes the current instance of the modal.
		 */
		this.close = function () {
			if (!_this.FooBox.raise('foobox.beforeClose').isDefaultPrevented()){
				_this._closed = true;
				_this._busy = false;
				_this.element.removeClass('fbx-loading fbx-show');
				$('body').removeClass('fbx-active');
				_this.FooBox.raise('foobox.close');
				_this.element.find('.fbx-item-current, .fbx-item-next').empty();
				if (_this.FooBox.options.hideScrollbars) { $('body,html').css('overflow', ''); }
				_this.FooBox.raise('foobox.afterClose');
			}
		};

		/**
		 * Shows the previous item in the collection, if the current item is the first this will loop back round to the last.
		 * @param {string} [type] - An optional item type to use when going to the previous item.
		 */
		this.prev = function (type) {
			if (_this._busy == true) return;
			_this.FooBox.items.indexes.set(_this.FooBox.items.indexes.prev);

			if (typeof type === 'string') {
				var item = _this.FooBox.items.current();
				while (item.type != type) {
					_this.FooBox.items.indexes.set(_this.FooBox.items.indexes.prev);
					item = _this.FooBox.items.current();
				}
			}

			_this.show(false);
			_this.FooBox.raise('foobox.previous');
		};

		/**
		 * Shows the next item in the collection, if the current item is the last this will loop back round to the first.
		 * @param {string} [type] - An optional item type to use when going to the next item.
		 */
		this.next = function (type) {
			if (_this._busy == true) return;
			_this.FooBox.items.indexes.set(_this.FooBox.items.indexes.next);

			if (typeof type === 'string') {
				var item = _this.FooBox.items.current();
				while (item.type != type) {
					_this.FooBox.items.indexes.set(_this.FooBox.items.indexes.next);
					item = _this.FooBox.items.current();
				}
			}

			_this.show(false);
			_this.FooBox.raise('foobox.next');
		};

		return this;
	};

	/**
	 * The core FooBox logic.
	 * @param {number} [id] - The optional id to create the instance with.
	 * @constructor
	 */
	FooBox.Instance = function (id) {
		/** @type {number} - The id of the current FooBox instance. */
		this.id = null;
		if (typeof id == 'number'){
			this.id = id;
			FooBox.instances[id - 1] = this;
		} else {
			this.id = FooBox.instances.push(this);
		}

		/** @type {jQuery} - The jQuery element the Foobox is bound to. */
		this.element = null;
		/** @type {Object} - The options for the current FooBox instance. */
		this.options = $.extend(true, {}, FooBox.defaults);
		/** @type {FooBox.Modal} - The modal object for this FooBox. */
		this.modal = new FooBox.Modal(this);
		/** @type {Object} - An object containing any registered object arrays. */
		this.objects = {};

		FooBox.addons.load(this);
		FooBox.handlers.load(this);

		/**
		 * @type {FooBox.Instance} - Hold a reference to this instance of the object to avoid scoping issues.
		 * @private
		 */
		var _this = this;

		/**
		 * Raises an event on this FooBox appending the args to the event.fb namespace.
		 * @param {string} event - The name of the event to raise, this can include namespaces.
		 * @param {Object} [args] - An object containing additional values to be merged into the event.fb namespace.
		 * @returns {jQuery.Event}
		 */
		this.raise = function (event, args) {
			return FooBox.raise(_this, event, args);
		};

		/**
		 * Initializes this instance of the object using the supplied element and options.
		 * @param {(jQuery|HTMLElement)} element - The jQuery or DOM element the FooBox was initialized on.
		 * @param {Object} options - The options supplied when the FooBox was initialized.
		 */
		this.init = function (element, options) {
			_this.element = FooBox.isjQuery(element) ? element : $(element);
			_this.options = FooBox.options.merge(_this.options, options || {});

			FooBox.addons.call(_this, 'preinit', _this.element, _this.options);

			//init code
			_this.items.init();
			if (_this.items.array.length > 0){
				_this.element.data('fbx_instance', _this);

				if (_this.options.containerCssClass) {
					_this.element.addClass(_this.options.containerCssClass);
				}

				_this.setup.bind();
				_this.modal.init(element, _this.options);

				FooBox.handlers.call(_this, 'init', _this.element, _this.options);

				_this.raise('foobox.initialized');

				if ($.isFunction(_this.options.initCallback)) {
					_this.options.initCallback.call(_this);
				}
			} else { // self cleanup, no items, no FooBox
				_this.destroy();
			}
		};

		/**
		 * Reinitializes this instance of the object using the supplied options.
		 * @param {Object} options - The options supplied when the FooBox was reinitialized.
		 */
		this.reinit = function (options) {
			_this.options = FooBox.options.merge(_this.options, options || {});

			//reinit code
			_this.items.init(true);
			if (_this.items.array.length > 0){
				_this.setup.bind();
				_this.modal.reinit(_this.options);

				FooBox.handlers.call(_this, 'reinit', _this.options);
				_this.raise('foobox.reinitialized');
			} else { // self cleanup, no items, no FooBox
				_this.destroy();
			}
		};

		/**
		 * Destroys this instance of the object removing any changes made to the DOM.
		 */
		this.destroy = function(){
			FooBox.addons.call(_this, 'destroy');
			FooBox.handlers.call(_this, 'destroy');

			_this.items.destroy();
			_this.modal.destroy();
			_this.element.removeClass('fbx-instance fbx-item').data({'fbx_instance': null, 'fbx_p_instance': null});

			if (_this.id == FooBox.instances.length){
				FooBox.instances.splice(_this.id - 1, 1);
			} else {
				FooBox.instances[_this.id - 1] = null;
			}
			_this.raise('foobox.destroy');
		};

		/** @namespace - Contains the logic used for initialization and reinitialization. */
		this.setup = {
			/**
			 * Binds any the events required for FooBox to function.
			 */
			bind: function () {
				// Bind any external element clicks to open FooBox.
				$(_this.options.externalSelector).unbind('click.fooboxExternal').bind('click.fooboxExternal', function (e) {
					e.preventDefault();
					var selector = $(this).data('foobox'), target = $(selector);
					var fbx = target.data('fbx_instance') || target.data('fbx_p_instance');
					if (target.length > 0 && fbx instanceof FooBox.Instance && fbx.modal instanceof FooBox.Modal) {
						fbx.modal.show(true);
					}
					return false;
				});
			}
		};

		/** @namespace - Contains the logic used for management of items. */
		this.items = {
			/** @type {Array} - An array containing all items for this instance of FooBox. */
			array: [],
			/** @namespace - Contains the logic used for the management of item indexes. */
			indexes: {
				/** @type {number} - The index of the previous item relative to the current. */
				prev: -1,
				/** @type {number} - The index of the current item being displayed. */
				current: 0,
				/** @type {number} - The index of the next item relative to the current. */
				next: 1,
				/** @type {string} - A directional indicator: * = unknown/no change, > = use next to proceed, < = use prev to proceed. */
				direction: '*',
				/**
				 * Sets the current, prev and next indexes given only the current by inspecting the items array to determine the min and max allowed indexes.
				 * @param {number} current - The new value that should be used for the current index.
				 */
				set: function (current) {
					var now = _this.items.indexes.current;
					current = current || 0;
					current = (current > _this.items.array.length - 1 ? 0 : (current < 0 ? _this.items.array.length - 1 : current));
					var prev = current - 1, next = current + 1;
					_this.items.indexes.current = current;
					_this.items.indexes.prev = (prev < 0) ? _this.items.array.length - 1 : prev;
					_this.items.indexes.next = (next > _this.items.array.length - 1) ? 0 : next;
					_this.items.indexes.direction = _this.items.indexes._direction(now, current, _this.items.array.length - 1);
				},
				/** @private */
				_direction: function (previous, current, max) {
					if (current == 0 && previous == max) { return '>'; }
					if (current == max && previous == 0) { return '<'; }
					if (current > previous) { return '>'; }
					if (current < previous) { return '<'; }
					return '*';
				}
			},
			/**
			 * Generates a new item array. If items are passed in as options they will be initialized here and added to the array.
			 * @param {boolean} [reinit] - A boolean indicating whether or not this is a reinit of the array.
			 */
			new_array: function (reinit) {
				reinit = reinit || false;
				var item, e, index = 0, base;

				if (reinit == true){
					if (_this.items.array.length > 0){
						// clean items that no longer exist
						for(var k = 0; k < _this.items.array.length; k++){
							item = _this.items.array[k];
							if (FooBox.isjQuery(item.element)){
								// if the item has an element
								if (item.element.parents(':first').length == 0){
									// and the parent no longer exists (the item is not in the DOM) remove it.
									_this.items.array.splice(k, 1);
									k -= 1;
								}
							} else if (!item.option) {
								// if the item was not created through options (option items have no element) remove it.
								_this.items.array.splice(k, 1);
								k -= 1;
							}
						}
						// reset the item indexes
						for(var l = 0; l < _this.items.array.length; l++){
							item = _this.items.array[l];
							if (FooBox.isjQuery(item.element)){
								base = item.element.get(0);
								base.index = item.index = l;
							} else {
								item.index = l;
							}
						}
					}
				} else { _this.items.array = []; }

				if ($.isArray(_this.options.items)) {
					for (var i = 0; i < _this.options.items.length; i++) {
						item = _this.options.items[i];
						if (_this.items.indexOf(item) != -1){ continue; }
						for (var j = 0; j < _this.objects.handlers.length; j++) {
							if (_this.objects.handlers[j].type == item.type) {
								item.index = index;
								item.option = true;
								item.handler = _this.objects.handlers[j];
								item.handler.defaults(item);
								e = _this.raise('foobox.parseItem', { 'element': null, 'item': item });
								_this.items.array.push(e.fb.item);
								index++;
								break;
							}
						}
					}
				}
			},
			/**
			 * Initializes this instances item collection by using either the options or querying the DOM.
			 * @param {boolean} [reinit] - A boolean indicating whether or not this is a reinit of the items.
			 */
			init: function (reinit) {
				reinit = reinit || false;
				_this.items.new_array(reinit);
				if (_this.element.is(_this.options.selector) && !_this.element.is(_this.options.excludes) && _this.items.add(_this.element)) {
					_this.element.unbind('click.item').bind('click.item', _this.items.clicked);
				} else {
					_this.element.find(_this.options.selector)
						.not(_this.options.excludes)
						.unbind('click.item')
						.filter(function () {
							return _this.items.add(this);
						})
						.bind('click.item', _this.items.clicked);
				}
				_this.items.rel();
			},
			/**
			 * Loops through all items and removes any modifications made by FooBox.
			 */
			destroy: function(){
				var item, i;
				for (i = 0; i < _this.items.array.length; i++){
					item = _this.items.array[i];
					if ($.isFunction(item.destroy)){
						item.destroy();
					}
					if (FooBox.isjQuery(item.element)){
						item.element.unbind('click.item').removeClass('fbx-link').data('fbx_p_instance', null);
					}
				}
				_this.items.array = [];
			},
			/**
			 * Checks if a rel option or attribute has been set and if it does finds any associated elements and combines them into a single collection.
			 */
			rel: function () {
				var rel = _this.options.rel || _this.element.attr('rel') || (_this.items.first(function(item){
					return typeof item.element.attr('rel') == 'string';
				}) || { element: $() }).element.attr('rel');

				if (typeof rel == 'string'){
					$('[rel="' + rel + '"]')
						.not(_this.options.excludes)
						.not(_this.element)
						.unbind('click.item')
						.filter(function () {
							return _this.items.add(this);
						})
						.bind('click.item', _this.items.clicked);
				}
			},
			/**
			 * Checks if a item exists in the items array by comparing the item.url property by default.
			 * If the second param 'prop' is supplied that property will be used for the comparison.
			 * Returns
			 * @param {FooBox.Item} item - The item to check if it exists.
			 * @param {string} [prop=url] - The property to use for comparisons.
			 * @returns {number} - (-1) if the item doesn't exist or the index of the item if it does.
			 */
			indexOf: function (item, prop) {
				if (!item) { return -1; }
				prop = prop || 'url';
				var i;
				for (i = 0; i < _this.items.array.length; i++) {
					if (_this.items.array[i][prop] != item[prop]) { continue; }
					return i;
				}
				return -1;
			},
			is: {
				/**
				 * Check if the supplied item is the first item in the array.
				 * @param {FooBox.Item} item - The item to check.
				 * @returns {boolean}
				 */
				first: function(item){
					if (!_this.items.array || _this.items.array.length == 0){ return false; }
					return _this.items.array[0].index == item.index;
				},
				/**
				 * Check if the supplied item is the last item in the array.
				 * @param {FooBox.Item} item - The item to check.
				 * @returns {boolean}
				 */
				last: function(item){
					if (!_this.items.array || _this.items.array.length == 0){ return false; }
					return _this.items.array[_this.items.array.length - 1].index == item.index;
				}
			},
			/**
			 * Attempts to parse an element and add an item to the array.
			 * @param {(jQuery|HTMLElement)} element - The jQuery or DOM element to inspect.
			 * @returns {boolean} - True if an item is successfully added to the item array.
			 */
			add: function (element) {
				element = FooBox.isjQuery(element) ? element : $(element);
				var item = _this.items.parse(element);
				if (item === null) { return false; }
				var base = element.get(0), index = _this.items.indexOf(item);
				if (index != -1) {
					// if the item exists dbl bind it so clicking on either element opens the image
					item = _this.items.array[index];
					base.index = item.index;
				} else {
					base.index = item.index = _this.items.array.push(item) - 1;
				}
				var fbx = element.addClass('fbx-link').data('fbx_p_instance');
				if (!(fbx instanceof FooBox.Instance)) {
					element.data('fbx_p_instance', _this);
				}
				return true;
			},
			/**
			 * Attempts to retrieve an item from the array using only the element.
			 * @param {(jQuery|HTMLElement)} element - The jQuery or DOM element to inspect.
			 * @returns {(Object|null)} - null if no item is found.
			 */
			get: function (element) {
				element = FooBox.isjQuery(element) ? element : $(element);
				var item = null, index = element.get(0).index;
				if (index && index > 0 && index <= _this.items.array.length - 1) { item = _this.items.array[index]; }
				return item;
			},
			/**
			 * Attempts to parse an item using all registered handlers being supplied just the element.
			 * @param {(jQuery|HTMLElement)} element - The jQuery or DOM element to parse.
			 * @returns {(FooBox.Item|null)} - null if unable to parse an item.
			 */
			parse: function (element) {
				element = FooBox.isjQuery(element) ? element : $(element);
				var item, e;
				for (var i = 0; i < _this.objects.handlers.length; i++) {
					if (_this.objects.handlers[i].handles(element, _this.element)) {
						item = _this.objects.handlers[i].parse(element);
						e = _this.raise('foobox.parseItem', { 'element': element, 'item': item });
						break;
					}
				}
				return typeof e !== "undefined" && e.fb.item ? e.fb.item : null;
			},
			/**
			 * Generates an error item and places it into the array at the supplied index.
			 * @param {number} index - The index at which to create the error item.
			 * @returns {FooBox.Item}
			 */
			error: function (index) {
				if (_this.items.array.length > index && _this.items.array[index].error == true) { return _this.items.array[index]; }

				var handler = FooBox.handlers.get(_this, 'html'), $element, error, isSelector = false;
				if (handler == null) {
					function ErrHandler(fbx){
						var _h = this;
						_h.FooBox = fbx;
						_h.type = 'error';
						_h.handles = function(){ return false; };
						_h.hasChanged = function(){ return false; };
						_h.defaults = function(){};
						_h.parse = function(){};
						_h.load = function (item, container, success, error) {
							try {
								container.empty().append(item.content);
								if ($.isFunction(success)){ success(_h.getSize(item)); }
							}
							catch (err) {
								if ($.isFunction(error)) { error(err); }
							}
						};
						_h.getSize = function(item){
							return new FooBox.Size(item.width, item.height);
						};
						return _h;
					}
					handler = new ErrHandler(_this);
				}
				if (_this.options.error.match(/^#/i) !== null && $(_this.options.error).length > 0) {
					$element = $(_this.options.error);
					isSelector = true;
				} else {
					var html = FooBox.format('<div class="fbx-error-msg" data-width="240" data-height="240"><span></span><p>{0}</p></div>', _this.options.error);
					$element = $(html);
				}
				error = new FooBox.Item(handler.type, $element.get(0), handler);
				error.selector = isSelector == true ? _this.options.error : null;
				error.index = index;
				error.error = true;
				error.title = $element.data('title') || null;
				error.description = $element.data('description') || null;
				error.width = $element.data('width') || 240 || null;
				error.height = $element.data('height') || 240 || null;
				error.content = isSelector == true ? null : $element;
				error.fullscreen = true;
				error.handler = handler;

				_this.items.array[index] = error;
				return error;
			},
			/**
			 * Gets the first item from the array of items matching the specified where clause.
			 * @param {function} where - A function that returns a boolean indicating a successful match. The first param is always the item.
			 */
			first: function(where){
				var item = null;
				for (var i = 0; i < _this.items.array.length; i++){
					if (where(_this.items.array[i])){
						item = _this.items.array[i];
						break;
					}
				}
				return item;
			},
			/**
			 * Gets the current item for FooBox.
			 * @returns {FooBox.Item}
			 */
			current: function () {
				return _this.items.array[_this.items.indexes.current];
			},
			/**
			 * Gets the previous item for FooBox relative to the current.
			 * @returns {FooBox.Item}
			 */
			prev: function () {
				return _this.items.array[_this.items.indexes.prev];
			},
			/**
			 * Gets the next item for FooBox relative to the current.
			 * @returns {FooBox.Item}
			 */
			next: function () {
				return _this.items.array[_this.items.indexes.next];
			},
			/**
			 * Checks whether or not there are multiple items in this FooBox.
			 * @returns {boolean} - True if there is more than 1 item.
			 */
			multiple: function () {
				return _this.items.array.length > 1;
			},
			/**
			 * Handles the click event for any items, setting the indexes and showing the modal.
			 * @param {jQuery.Event} e - The jQuery clicked event argument.
			 * @returns {boolean} - Always false to cancel default click behaviour.
			 */
			clicked: function (e) {
				e.preventDefault();
				_this.items.indexes.set(this.index);
				_this.modal.show(true);
				return false;
			}
		};
		return this;
	};

	/**
	 * Shortcut for opening a FooBox.
	 * @param {(number|Object)} arg - The index of the instance of FooBox to open or an object containing options for a new instance of FooBox.
	 * @returns {(FooBox.Instance|null)} - The opened instance of FooBox or null if no action was taken.
	 */
	FooBox.open = function (arg) {
		if (FooBox.isDeepLink == true){ return null; }
		var fbx = null, i;
		if (typeof arg == 'object'){
			var element = document.createElement('a');
			$(element).foobox(arg);
			fbx = $(element).data('fbx_instance');
		} else {
			if (typeof arg == 'number'){ i = arg;	}
			else {
				i = parseInt(arg || 0);
				i = isNaN(i) ? 0 : i;
			}
			i = i > FooBox.instances.length - 1 ? FooBox.instances.length - 1 : i < 0 ? 0 : i;
			fbx = FooBox.instances[i];
		}
		if (fbx == null || !(fbx.modal instanceof FooBox.Modal)){ return null; }
		fbx.modal.show(true);
		return fbx;
	};

	/**
	 * Shortcut for closing all open FooBox's.
	 */
	FooBox.close = function () {
		var instances = [], i, fbx = null;
		for (i = 0; i < FooBox.instances.length; i++){
			fbx = FooBox.instances[i];
			if (fbx == null || !(fbx.modal instanceof FooBox.Modal) || !FooBox.isjQuery(fbx.modal.element) || !fbx.modal.element.hasClass('fbx-show')){ continue; }
			instances.push(fbx);
		}
		for (i = 0; i < instances.length; i++){
			fbx = instances[i];
			fbx.modal.close();
		}
	};

	/**
	 * Causes the FooBox to resize to the supplied dimensions. Both parameters are optional and setting just one will cause only that one to be changed.
	 * If both are not set this will simply trigger the default resize method of FooBox.
	 * @param {number} [width]
	 * @param {number} [height]
	 */
	FooBox.resize = function(width, height){
		if (width || height){
			var i, fbx, item, size;
			for (i = 0; i < FooBox.instances.length; i++){
				fbx = FooBox.instances[i];
				if (fbx == null || !(fbx.modal instanceof FooBox.Modal) || !FooBox.isjQuery(fbx.modal.element) || !fbx.modal.element.hasClass('fbx-show')){ continue; }
				item = fbx.items.current();
				size = new FooBox.Size((width || item.width || 0), (height || item.height || 0));
				item.width = size.width;
				item.height = size.height;
				fbx.modal.resize(size);
			}
		} else {
			$(window).trigger('resize.foobox');
		}
	};

})(jQuery, window, window.console);;/* jslint devel: true, browser: true, unparam: true, debug: false, es5: true, white: false, maxerr: 1000 */
/**!
 * FooBox HtmlHandler - A handler providing support for HTML items for the FooBox plugin.
 * @version 2.0.0
 * @copyright Steven Usher & Brad Vincent 2013
 */
(function ($, FooBox) {

	/** @type {Object} - Contains the default option values for the HTML handler. */
	var defaults = {
		/** @type {Object} - An object containing HTML handler related options. */
		html: {
			/** @type {string} - A String determining the attribute to check on the element. */
			attr: 'href',
			/** @type {boolean} - A Boolean indicating whether or not to allow overflow by default on HTML items. */
			overflow: true,
			/** @type {boolean} - A Boolean indicating whether or not to allow fullscreen by default on HTML items. */
			fullscreen: true,
			/** @type {number} - A number indicating the extra padding to apply to the size of the HTML element. */
			sizePadding: 20,
			/** @type {boolean} - A Boolean indicating whether or not to display captions on a HTML item. */
			showCaptions: false,
			/** @type {RegExp} - A regular expression used to check whether or not this handler handles an item. */
			regex: /^#/i,
			/**
			 * @type {function} - A Function to use to 'find' the selector on an element.
			 * @param {FooBox.Instance} foobox - The parent instance of FooBox.
			 * @param {jQuery} element - The jQuery element to find the selector on.
			 * @returns {string}
			 */
			findSelector: function (foobox, element) {
				if (!element) { return ''; }
				var attr = element.attr(foobox.options.html.attr);
				return (typeof attr == 'string') ? element.attr(foobox.options.html.attr) : '';
			}
		}
	};

	/**
	 * Extend the FooBox.Item with additional properties used by this handler.
	 */
	/** @type {jQuery} - The jQuery object containing the content to display. */
	FooBox.Item.prototype.content = null;
	/** @type {string} - The selector for the element to display. */
	FooBox.Item.prototype.selector = null;
	/** @type {number} - The amount of padding to apply to the item when displayed. */
	FooBox.Item.prototype.padding = null;

	/**
	 * The core logic for the FooBox.HtmlHandler addon.
	 * @param {FooBox.Instance} instance - The parent FooBox instance for this handler.
	 * @constructor
	 */
	FooBox.HtmlHandler = function(instance) {

		/** @type {FooBox.Instance} - The parent FooBox instance for this handler. */
		this.FooBox = instance;
		/** @type {string} - A String representing the type this handler parses. */
		this.type = 'html';
		/** @type {RegExp} - The regular expression used to check whether or not this handler handles an item. */
		this.regex = /^#/i;

		/**
		 * @type {FooBox.HtmlHandler} - Hold a reference to this instance of the object to avoid scoping issues.
		 * @private
		 */
		var _this = this;

		/**
		 * This method is called after the core FooBox plugin and addons are initialized.
		 * @param {jQuery} element - The jQuery element the parent FooBox instance will be created and raising events on.
		 * @param {Object} options - The options used to initialize the FooBox instance.
		 */
		this.init = function(element){
			_this.handlers.unbind();
			element.bind('foobox.close', _this.handlers.onClose);
		};

		/**
		 * This method is called when the core FooBox plugin is destroyed. This allows addons to unbind all events and remove any additional DOM elements added outside the modal.
		 */
		this.destroy = function(){
			_this.handlers.unbind();
		};

		/** @namespace - Contains all the event handlers used by this handler. */
		this.handlers = {
			/**
			 * This unbinds event handlers used by this addon.
			 */
			unbind: function(){
				_this.FooBox.element.unbind('foobox.close', _this.handlers.onClose);
			},
			/**
			 * Handles the foobox.close event.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			onClose: function(){
				var i, item;
				for(i = 0; i < _this.FooBox.items.array.length; i++){
					item = _this.FooBox.items.array[i];
					if (item.type == _this.type && FooBox.isjQuery(item.content) && item.error == false && $(item.selector).length > 0){
						$(item.selector).append(item.content.children());
						item.content = null;
					}
				}
			}
		};

		/**
		 * Determines whether or not this handler handles the element supplied.
		 * @param {jQuery} element - The jQuery element to check.
		 * @param {jQuery} container - The jQuery element the core FooBox plugin was initialized on.
		 * @returns {boolean} - True if this handler handles the supplied element.
		 */
		this.handles = function (element) {
			var selector = _this.FooBox.options.html.findSelector(_this.FooBox, element),
				handle = $(element).attr('target') === 'foobox' && typeof selector === 'string' && selector.match(_this.FooBox.options.html.regex) != null && ($(selector).length > 0 || $(element).data('ajax') == true);

			var e = _this.FooBox.raise('foobox.handlesHtml', { 'element': element, 'handle': handle });
			return e.fb.handle;
		};

		/**
		 * Sets the default values for an item parsed by this handler.
		 * @param {FooBox.Item} item - The new item to set default values on.
		 */
		this.defaults = function(item){
			item.fullscreen = item.fullscreen || _this.FooBox.options.html.fullscreen;
			item.overflow = item.overflow || _this.FooBox.options.html.overflow;
			item.social = item.social || true;
			item.proportion = item.proportion || false;
			item.captions = item.captions || _this.FooBox.options.html.showCaptions;
		};

		/**
		 * Parses the supplied element into an item for use by FooBox.
		 * @param {jQuery} element - The jQuery element to parse into an item.
		 * @returns {FooBox.Item}
		 */
		this.parse = function (element) {
			var item = new FooBox.Item(_this.type, element, this);

			_this.defaults(item);

			item.url = item.selector = _this.FooBox.options.html.findSelector(_this.FooBox, element) || null;
			item.padding = element.data('padding') || _this.FooBox.options.html.sizePadding || 0;
			_this.getSize(item);

			var $target = item.selector != null ? $(item.selector) : null;
			if ($target != null && $target.length > 0) {
				item.width = $target.data('width') || element.data('width') || item.width || null;
				item.height = $target.data('height') || element.data('height') || item.height || null;
			} else {
				item.width = element.data('width') || item.width || null;
				item.height = element.data('height') || item.height || null;
			}
			item.overflow = typeof element.data('overflow') == 'boolean' ? element.data('overflow') : item.overflow;
			item.fullscreen = typeof element.data('fullscreen') == 'boolean' ? element.data('fullscreen') : item.fullscreen;
			item.proportion = typeof element.data('proportion') == 'boolean' ? element.data('proportion') : item.proportion;
			item.image_url = element.data('image') || '';
			return item;
		};

		/**
		 * Attempts to load the supplied items content executing the supplied callbacks as required.
		 * @param {FooBox.Item} item - The item to load.
		 * @param {jQuery} container - The jQuery element the core FooBox plugin was initialized on.
		 * @param {function} success - The function to execute if the loading succeeds. This will be supplied the size of the item as the first parameter.
		 * @param {function} error - The function to execute if the loading fails.
		 */
		this.load = function (item, container, success, error) {
			try {
				var $html = $('<div/>').addClass('fbx-item');

				// seeing as I made this handle the errors I've added this small if else to append the correct class when needed.
				if (item.error == true){ $html.addClass('fbx-item-error'); }
				else { $html.addClass('fbx-item-html'); }

				if (item.content == null && typeof item.selector == 'string'){
					if ($(item.selector).length == 0){
						var e = _this.FooBox.raise('foobox.loadHtml', {
							container: $html,
							selector: item.selector,
							success: function(){
								item.content = e.fb.container;
								container.empty().append(item.content);
								if ($.isFunction(success)){ success(_this.getSize(item)); }
							},
							error: function(err){
								err = err || 'Unable to load HTML.';
								if ($.isFunction(error)){ error(err); }
							}
						});
						return;
					} else {
						var $content = $(item.selector);
						if ($content.length > 0){
							item.content = $html.append($content.children());
						}
					}
				}
				if (FooBox.isjQuery(item.content)){
					container.empty().append(item.content);
					if ($.isFunction(success)){ success(_this.getSize(item)); }
				} else {
					if ($.isFunction(error)){ error('No valid HTML found to display.'); }
				}
			} catch (err) {
				if ($.isFunction(error)){ error(err); }
			}
		};

		/**
		 * If required preloads the item to reduce load time changing between previous and next items.
		 * @param {FooBox.Item} item - The item to preload if required.
		 */
		this.preload = function(item){

		};

		/**
		 * Small function to retrieve CSS prop values for sizing.
		 * @param {jQuery} element - The element to retrieve the CSS prop values from.
		 * @returns {Object}
		 */
		this.getCSS = function(element){
			return { 'font': element.css('font'), 'padding': element.css('padding'), 'margin': element.css('margin'), 'border': element.css('border') };
		};

		/**
		 * Retrieves the size for the supplied item. If no width and height is set this should attempt to find the size.
		 * @param {FooBox.Item} item - The item to retrieve the size for.
		 * @returns {FooBox.Size}
		 */
		this.getSize = function (item) {
			if ((item.width == null || item.height == null || item.width == 0 || item.height == 0) && typeof item.selector == 'string') {
				var $clone, styles;
				if (typeof item.selector == 'string' && $(item.selector).length > 0){
					var $item = $(item.selector);
					styles = _this.getCSS($item);
					$clone = $item.clone().css(styles);
				} else if (FooBox.isjQuery(item.content)) {
					styles = _this.getCSS(item.content);
					$clone = item.content.clone().css(styles);
				}
				if (FooBox.isjQuery($clone)){
					$clone.css({ position: 'absolute', visibility: 'hidden', display: 'block', top: -10000, left: -10000 }).appendTo('body');
					if (typeof item.width == 'number' && item.width > 0){ $clone.width(item.width); }
					else { item.width = $clone.outerWidth(true) + item.padding; }
					item.height = (typeof item.height == 'number' && item.height > 0) ? item.height : $clone.outerHeight(true) + item.padding;
					$clone.remove();
				}
			}
			if (item.width != null && item.height != null){
				return new FooBox.Size(item.width, item.height);
			}
			// If all else fails... return (0, 0)
			return new FooBox.Size(0, 0);
		};

		/**
		 * This is called prior to displaying the item. You can perform various checks here to determine whether or not the item has changed since it's last display.
		 * @param {FooBox.Item} item - The item to check for changes.
		 * @returns {boolean} - True if the item has changed otherwise false.
		 */
		this.hasChanged = function () {
			return false;
		};
	};

	FooBox.handlers.register(FooBox.HtmlHandler, defaults);

})(jQuery, window.FooBox);;/* jslint devel: true, browser: true, unparam: true, debug: false, es5: true, white: false, maxerr: 1000 */
/**!
 * FooBox IframeHandler - A handler providing support for iframe items for the FooBox plugin.
 * @version 2.0.0
 * @copyright Steven Usher & Brad Vincent 2013
 */
(function ($, FooBox) {

	/** @type {Object} - Contains the default option values for the iframe handler. */
	var defaults = {
		/** @type {Object} - An object containing iframe handler related options. */
		iframe: {
			/** @type {string} - A String determining the attribute to check on the element. */
			attr: 'href',
			/** @type {boolean} - A Boolean indicating whether or not to allow fullscreen by default on IFRAME items. */
			fullscreen: true,
			/** @type {boolean} - A Boolean indicating whether or not to display captions on a IFRAME item. */
			showCaptions: false,
			/** @type {boolean} - A Boolean indicating whether or not to display the modal immediately or to wait for the IFRAME to load. */
			showImmediate: false,
			/** @type {boolean} - A Boolean indicating whether or not to add the allowfullscreen attribute onto the IFRAME. */
			allowFullscreen: false,
			/** @type {RegExp} - A regular expression used to check whether or not this handler handles an item. */
			regex: /^https?/i,
			/** @type {RegExp} - A regular expression used to exclude an item. */
			exclude: /(youtube(-nocookie)?\.com\/(watch|v|embed)|youtu\.be|vimeo\.com)/i,
			/**
			 * @type {function} - A Function to use to 'find' the url on an element.
			 * @param {FooBox.Instance} foobox - The parent instance of FooBox.
			 * @param {jQuery} element - The jQuery element to find the selector on.
			 * @returns {string}
			 */
			findUrl: function (foobox, element) {
				if (!element) { return ''; }
				var attr = element.attr(foobox.options.iframe.attr);
				return (typeof attr == 'string') ? FooBox.qualifiedURL(element.attr(foobox.options.iframe.attr)) : '';
			}
		}
	};

	/**
	 * The core logic for the FooBox.IframeHandler addon.
	 * @param {FooBox.Instance} instance - The parent FooBox instance for this handler.
	 * @constructor
	 */
	FooBox.IframeHandler = function (instance) {

		/** @type {FooBox.Instance} - The parent FooBox instance for this handler. */
		this.FooBox = instance;
		/** @type {string} - A String representing the type this handler parses. */
		this.type = 'iframe';

		/**
		 * @type {FooBox.IframeHandler} - Hold a reference to this instance of the object to avoid scoping issues.
		 * @private
		 */
		var _this = this;

		/**
		 * Determines whether or not this handler handles the element supplied.
		 * @param {jQuery} element - The jQuery element to check.
		 * @param {jQuery} container - The jQuery element the core FooBox plugin was initialized on.
		 * @returns {boolean} - True if this handler handles the supplied element.
		 */
		this.handles = function (element) {
			var href = _this.FooBox.options.iframe.findUrl(_this.FooBox, element);
			var handle = $(element).attr('target') === 'foobox' && typeof href === 'string' && href.match(_this.FooBox.options.iframe.regex) != null && !href.match(_this.FooBox.options.iframe.exclude);
			var e = _this.FooBox.raise('foobox.handlesIframe', { 'element': element, 'handle': handle });
			return e.fb.handle;
		};

		/**
		 * Sets the default values for an item parsed by this handler.
		 * @param {FooBox.Item} item - The new item to set default values on.
		 */
		this.defaults = function (item) {
			item.fullscreen = item.fullscreen || _this.FooBox.options.iframe.fullscreen;
			item.overflow = item.overflow || false;
			item.social = item.social || true;
			item.proportion = item.proportion || false;
			item.captions = item.captions || _this.FooBox.options.iframe.showCaptions;
		};

		/**
		 * Parses the supplied element into an item for use by FooBox.
		 * @param {jQuery} element - The jQuery element to parse into an item.
		 * @returns {FooBox.Item}
		 */
		this.parse = function (element) {
			var item = new FooBox.Item(_this.type, element, this);

			_this.defaults(item);

			item.url = _this.FooBox.options.iframe.findUrl(_this.FooBox, element) || null;
			item.width = element.data('width') || item.width || null;
			item.height = element.data('height') || item.height || null;
			item.overflow = typeof element.data('overflow') == 'boolean' ? element.data('overflow') : item.overflow;
			item.fullscreen = typeof element.data('fullscreen') == 'boolean' ? element.data('fullscreen') : item.fullscreen;
			item.proportion = typeof element.data('proportion') == 'boolean' ? element.data('proportion') : item.proportion;
			item.image_url = element.data('image') || '';
			return item;
		};

		/**
		 * Attempts to load the supplied items content executing the supplied callbacks as required.
		 * @param {FooBox.Item} item - The item to load.
		 * @param {jQuery} container - The jQuery element the core FooBox plugin was initialized on.
		 * @param {function} success - The function to execute if the loading succeeds. This will be supplied the size of the item as the first parameter.
		 * @param {function} error - The function to execute if the loading fails.
		 */
		this.load = function (item, container, success, error) {
			try {
				var size = _this.getSize(item);
				var $html = $('<iframe />').addClass('fbx-item fbx-item-iframe').css({
					width: size.width,
					height: size.height
				});
				if (_this.FooBox.options.iframe.allowFullscreen && item.fullscreen) {
					$html.attr('allowfullscreen', '');
				}
				container.empty().append($html);
				if (_this.FooBox.options.iframe.showImmediate){
					$html.attr('src', item.url);
					if ($.isFunction(success)) { success(size); }
				} else {
					$html.one('load', function(){
						if ($.isFunction(success)) { success(size); }
					}).attr('src', item.url);
				}
			} catch (err) {
				if ($.isFunction(error)) { error(err); }
			}
		};

		/**
		 * If required preloads the item to reduce load time changing between previous and next items.
		 * @param {FooBox.Item} item - The item to preload if required.
		 */
		this.preload = function(item){

		};

		/**
		 * Retrieves the size for the supplied item. If no width and height is set this should attempt to find the size.
		 * @param {FooBox.Item} item - The item to retrieve the size for.
		 * @returns {FooBox.Size}
		 */
		this.getSize = function (item) {
			if (item.auto || item.width == null || item.width == 0 || item.height == null || item.height == 0){
				item.auto = item.auto || { width: false, height: false };
				if (item.auto.width == true || item.width == null || item.width == 0){
					item.auto.width = true;
					item.width = (window.innerWidth || document.documentElement.clientWidth || (document.body ? document.body.offsetWidth : 0)) * 0.8;
				}
				if (item.auto.height == true || item.height == null || item.height == 0){
					item.auto.height = true;
					item.height = (window.innerHeight || document.documentElement.clientHeight || (document.body ? document.body.offsetHeight : 0)) * 0.8;
				}
			}

			if (item.width != null && item.height != null) {
				return new FooBox.Size(item.width, item.height);
			}
			// If all else fails... return (0, 0)
			return new FooBox.Size(0, 0);
		};

		/**
		 * This is called prior to displaying the item. You can perform various checks here to determine whether or not the item has changed since it's last display.
		 * @param {FooBox.Item} item - The item to check for changes.
		 * @returns {boolean} - True if the item has changed otherwise false.
		 */
		this.hasChanged = function () {
			return false;
		};
	};

	FooBox.handlers.register(FooBox.IframeHandler, defaults);

})(jQuery, window.FooBox);;/* jslint devel: true, browser: true, unparam: true, debug: false, es5: true, white: false, maxerr: 1000 */
/**!
 * FooBox ImageHandler - A handler providing support for image items for the FooBox plugin.
 * @version 2.0.0
 * @copyright Steven Usher & Brad Vincent 2013
 */
(function ($, FooBox) {

	/** @type {Object} - Contains the default option values for the images handler. */
	var defaults = {
		/** @type {Object} - An object containing image handler related options. */
		images: {
			/** @type {boolean} - A Boolean indicating whether or not to allow users to right click on an image. */
			noRightClick: false,
			/** @type {string} - A String determining the attribute to check on the element. */
			attr: 'href',
			/** @type {boolean} - A Boolean indicating whether or not to allow overflow by default on image items. */
			overflow: false,
			/** @type {boolean} - A Boolean indicating whether or not to allow fullscreen by default on image items. */
			fullscreen: true,
			/** @type {boolean} - A Boolean indicating whether or not to display captions on a IMAGE item. */
			showCaptions: true,
			/** @type {RegExp} - A regular expression used to check whether or not this handler handles an item. */
			regex: /\.(jpg|jpeg|png|gif|bmp)/i,
			/**
			 * @type {function} - A Function to use to 'find' the url on an element.
			 * @param {FooBox.Instance} foobox - The parent instance of FooBox.
			 * @param {jQuery} element - The jQuery element to find the selector on.
			 * @returns {string}
			 */
			findUrl: function (foobox, element) {
				if (!element) { return ''; }
				if (element.data('image')) { return element.data('image'); }
				var attr = element.attr(foobox.options.images.attr);
				return (typeof attr == 'string') ? FooBox.qualifiedURL(element.attr(foobox.options.images.attr)) : '';
			}
		}
	};

	/**
	 * Extend the FooBox.Item with additional properties used by this addon.
	 */
	/** @type {Image} - The image for this item. */
	FooBox.Item.prototype.image = null;

	/**
	 * The core logic for the FooBox.ImageHandler addon.
	 * @param {FooBox.Instance} instance - The parent FooBox instance for this handler.
	 * @constructor
	 */
	FooBox.ImageHandler = function (instance) {

		/** @type {FooBox.Instance} - The parent FooBox instance for this handler. */
		this.FooBox = instance;
		/** @type {string} - A String representing the type this handler parses. */
		this.type = 'image';

		/**
		 * @type {FooBox.ImageHandler} - Hold a reference to this instance of the object to avoid scoping issues.
		 * @private
		 */
		var _this = this;

		/**
		 * Determines whether or not this handler handles the element supplied.
		 * @param {jQuery} element - The jQuery element to check.
		 * @param {jQuery} container - The jQuery element the core FooBox plugin was initialized on.
		 * @returns {boolean} - True if this handler handles the supplied element.
		 */
		this.handles = function (element) {
			var url = _this.FooBox.options.images.findUrl(_this.FooBox, element);
			var handle = typeof url === 'string' && url.match(_this.FooBox.options.images.regex) != null;
			var e = _this.FooBox.raise('foobox.handlesImage', { 'element': element, 'handle': handle });
			return e.fb.handle;
		};

		/**
		 * Sets the default values for an item parsed by this handler.
		 * @param {FooBox.Item} item - The new item to set default values on.
		 */
		this.defaults = function (item) {
			item.fullscreen = item.fullscreen || _this.FooBox.options.images.fullscreen;
			item.captions = item.captions || _this.FooBox.options.images.showCaptions;
			item.social = item.social || true;
			item.overflow = item.overflow || _this.FooBox.options.images.overflow;
			item.proportion = item.proportion || true;
		};

		/**
		 * Parses the supplied element into an item for use by FooBox.
		 * @param {jQuery} element - The jQuery element to parse into an item.
		 * @returns {FooBox.Item}
		 */
		this.parse = function (element) {
			var item = new FooBox.Item(_this.type, element, this);

			_this.defaults(item);

			item.url = _this.FooBox.options.images.findUrl(_this.FooBox, element) || null;
			item.width = element.data('width') || item.width || null;
			item.height = element.data('height') || item.height || null;
			item.fullscreen = typeof element.data('fullscreen') == 'boolean' ? element.data('fullscreen') : item.fullscreen;
			item.overflow = typeof element.data('overflow') == 'boolean' ? element.data('overflow') : item.overflow;
			item.proportion = typeof element.data('proportion') == 'boolean' ? element.data('proportion') : item.proportion;
			item.image = null;
			item.image_url = item.url;

			return item;
		};

		/**
		 * Attempts to load the supplied items content executing the supplied callbacks as required.
		 * @param {FooBox.Item} item - The item to load.
		 * @param {jQuery} container - The jQuery element the core FooBox plugin was initialized on.
		 * @param {function} success - The function to execute if the loading succeeds. This will be supplied the size of the item as the first parameter.
		 * @param {function} error - The function to execute if the loading fails.
		 */
		this.load = function (item, container, success, error) {
			try {
				var _load = function () {
					var $img = $(item.image).addClass('fbx-item fbx-item-image');
					if (_this.FooBox.options.images.noRightClick) {
						$img.bind('contextmenu', function (e) {
							e.preventDefault();
							return false;
						});
					}
					container.empty().append($img);
					if ($.isFunction(success)) { success(_this.getSize(item)); }
				};
				if (!item.image || item.image === null) {
					item.image = new Image();
					item.image.onload = function () {
						item.image.onload = item.image.onerror = null;
						item.height = item.image.height;
						item.width = item.image.width;
						_load();
					};
					item.image.onerror = function () {
						item.image.onload = item.image.onerror = null;
						item.image = null;
						if ($.isFunction(error)) { error('An error occurred attempting to load the image.'); }
					};
					item.image.src = item.url;
				} else {
					_load();
				}
			} catch (err) {
				if ($.isFunction(error)) { error(err); }
			}
		};

		/**
		 * If required preloads the item to reduce load time changing between previous and next items.
		 * @param {FooBox.Item} item - The item to preload if required.
		 */
		this.preload = function (item) {
			if (item.preloaded != true) {
				var image = new Image();
				image.src = item.url;
				item.preloaded = true;
			}
		};

		/**
		 * Retrieves the size for the supplied item. If no width and height is set this should attempt to find the size.
		 * @param {FooBox.Item} item - The item to retrieve the size for.
		 * @returns {FooBox.Size}
		 */
		this.getSize = function (item) {
			if (item.width != null && item.height != null) {
				return new FooBox.Size(item.width, item.height);
			}
			// If all else fails... return (0, 0)
			return new FooBox.Size(0, 0);
		};

		/**
		 * This is called prior to displaying the item. You can perform various checks here to determine whether or not the item has changed since it's last display.
		 * @param {FooBox.Item} item - The item to check for changes.
		 * @returns {boolean} - True if the item has changed otherwise false.
		 */
		this.hasChanged = function (item) {
			if (FooBox.isjQuery(item.element)) {
				var actual = _this.FooBox.options.images.findUrl(_this.FooBox, item.element);
				return item.url != actual;
			}
			return false;
		};
	};

	FooBox.handlers.register(FooBox.ImageHandler, defaults);

})(jQuery, window.FooBox);;/* jslint devel: true, browser: true, unparam: true, debug: false, es5: true, white: false, maxerr: 1000 */
/**!
 * FooBox VideoHandler - A handler providing support for video items for the FooBox plugin.
 * @version 2.0.0
 * @copyright Steven Usher & Brad Vincent 2013
 */
(function ($, FooBox) {

	/** @type {Object} - Contains the default option values for the video handler. */
	var defaults = {
		/** @type {Object} - An object containing video handler related options. */
		videos: {
			/** @type {string} - A String determining the attribute to check on the element. */
			attr: 'href',
			/** @type {boolean} - A Boolean indicating whether or not to allow fullscreen by default on video items. */
			fullscreen: true,
			/** @type {RegExp} - A regular expression used to check whether or not this handler handles an item. */
			regex: /(youtube(-nocookie)?\.com\/(watch|v|embed)|youtu\.be|vimeo\.com)/i,
			/**
			 * @type {function} - A Function to use to 'find' the url on an element.
			 * @param {FooBox.Instance} foobox - The parent instance of FooBox.
			 * @param {jQuery} element - The jQuery element to find the selector on.
			 * @returns {string}
			 */
			findUrl: function (foobox, element) {
				if (!element) { return ''; }
				var attr = element.attr(foobox.options.videos.attr);
				return (typeof attr == 'string') ? FooBox.qualifiedURL(element.attr(foobox.options.videos.attr)) : '';
			},
			/** @type {boolean} - A Boolean indicating whether or not to autoplay a video item. */
			autoPlay: false,
			/** @type {number} - The default width to use for video items if none is supplied. */
			defaultWidth: 640,
			/** @type {number} - The default height to use for video items if none is supplied. */
			defaultHeight: 385,
			/** @type {boolean} - A Boolean indicating whether or not to display captions on a VIDEO item. */
			showCaptions: false
		}
	};

	/** @type {string} - The id for this item's video. */
	FooBox.Item.prototype.video_id = null;
	/** @type {string} - The type of video this item displays. e.g. youtube/vimeo/etc. */
	FooBox.Item.prototype.video_type = null;
	/** @type {string} - The url for the video. */
	FooBox.Item.prototype.video_url = null;
	/** @type {string} - The url for the video's image. */
	FooBox.Item.prototype.image_url = null;
	/** @type {boolean} - Whether or not the item is a valid video item or not. */
	FooBox.Item.prototype.video_valid = false;

	/**
	 * The core logic for the FooBox.VideoHandler addon.
	 * @param {FooBox.Instance} instance - The parent FooBox instance for this handler.
	 * @constructor
	 */
	FooBox.VideoHandler = function (instance) {

		/** @type {FooBox.Instance} - The parent FooBox instance for this handler. */
		this.FooBox = instance;
		/** @type {string} - A String representing the type this handler parses. */
		this.type = 'video';

		/**
		 * @type {FooBox.VideoHandler} - Hold a reference to this instance of the object to avoid scoping issues.
		 * @private
		 */
		var _this = this;

		/**
		 * Determines whether or not this handler handles the element supplied.
		 * @param {jQuery} element - The jQuery element to check.
		 * @param {jQuery} container - The jQuery element the core FooBox plugin was initialized on.
		 * @returns {boolean} - True if this handler handles the supplied element.
		 */
		this.handles = function (element) {
			var url = _this.FooBox.options.videos.findUrl(_this.FooBox, element);
			var handle = typeof url === 'string' && url.match(_this.FooBox.options.videos.regex) != null;
			var e = _this.FooBox.raise('foobox.handlesVideo', { 'element': element, 'handle': handle });
			return e.fb.handle;
		};

		/**
		 * Sets the default values for an item parsed by this handler.
		 * @param {FooBox.Item} item - The new item to set default values on.
		 */
		this.defaults = function (item) {
			item.width = item.width || _this.FooBox.options.videos.defaultWidth;
			item.height = item.height || _this.FooBox.options.videos.defaultHeight;
			item.fullscreen = item.fullscreen || _this.FooBox.options.videos.fullscreen;
			item.social = item.social || true;
			item.captions = item.captions || _this.FooBox.options.videos.showCaptions;
			item.proportion = item.proportion || true;
		};

		/**
		 * Parses the supplied element into an item for use by FooBox.
		 * @param {jQuery} element - The jQuery element to parse into an item.
		 * @returns {FooBox.Item}
		 */
		this.parse = function (element) {
			var item = new FooBox.Item(_this.type, element, this);

			_this.defaults(item);

			item.url = _this.FooBox.options.videos.findUrl(_this.FooBox, element) || null;
			item.width = element.data('width') || item.width || null;
			item.height = element.data('height') || item.height || null;
			item.image_url = element.data('image') || element.find('img').attr('src') || null;
			item.fullscreen = typeof element.data('fullscreen') == 'boolean' ? element.data('fullscreen') : item.fullscreen;
			item.proportion = typeof element.data('proportion') == 'boolean' ? element.data('proportion') : item.proportion;
			return item;
		};

		/**
		 * Attempts to load the supplied items content executing the supplied callbacks as required.
		 * @param {FooBox.Item} item - The item to load.
		 * @param {jQuery} container - The jQuery element the core FooBox plugin was initialized on.
		 * @param {function} success - The function to execute if the loading succeeds. This will be supplied the size of the item as the first parameter.
		 * @param {function} error - The function to execute if the loading fails.
		 */
		this.load = function (item, container, success, error) {
			try {

				var url = item.url,
					protocol = url.substring(0,5) == 'https' ? 'https:' : 'http:';

				if (url.match('//(www.)?youtube|youtu\.be')) {
					if (url.match('embed')) {
						item.video_id = url.split(/embed\//)[1].split('"')[0];
					} else {
						item.video_id = url.split(/v\/|v=|youtu\.be\//)[1].split(/[?&]/)[0];
					}

					item.video_type = 'youtube';
					item.video_url = protocol + '//www.youtube.com/embed/' + item.video_id;

					//show related videos when playback ends
					item.video_url += (_this.getUrlVar('rel', url)) ? '?rel=' + _this.getUrlVar('rel', url) : '?rel=0';

					item.video_valid = true;
				} else if (url.match('//(player.)?vimeo\.com')) {
					item.video_type = 'vimeo';
					var vimeo_match = url.match(/https?:\/\/(?:www\.)?vimeo\.com\/(?:(\d+)|channels\/\w+?\/(\d+))/);
					item.video_id = (vimeo_match[1] | vimeo_match[2]);
					item.video_url = protocol + '//player.vimeo.com/video/' + item.video_id;

					item.video_valid = true;
				}

				if (item.video_valid === true) {
					//autoplay
					if (_this.FooBox.options.videos.autoPlay || _this.getUrlVar('autoplay', url) === '1') { item.video_url = _this.appendUrlVar('autoplay=1', item.video_url);}

					var $html = $('<iframe webkitAllowFullScreen mozallowfullscreen allowFullScreen style="width:100%; height:100%" frameborder="no" />')
						.attr('src', item.video_url)
						.addClass('fbx-item fbx-item-video');
					container.empty().append($html);
					if ($.isFunction(success)) { success(_this.getSize(item)); }
				} else {
					if ($.isFunction(error)) { error('The video [' + item.url + '] is not supported'); }
				}
			} catch (err) {
				if ($.isFunction(error)) { error(err); }
			}
		};

		/**
		 * If required preloads the item to reduce load time changing between previous and next items.
		 * @param {FooBox.Item} item - The item to preload if required.
		 */
		this.preload = function(item){

		};

		/**
		 * Retrieves the size for the supplied item. If no width and height is set this should attempt to find the size.
		 * @param {FooBox.Item} item - The item to retrieve the size for.
		 * @returns {FooBox.Size}
		 */
		this.getSize = function (item) {
			if (item.width == null || item.height == null) {
				item.width = _this.FooBox.options.videos.defaultWidth;
				item.height = _this.FooBox.options.videos.defaultHeight;
			}
			if (item.width != null && item.height != null) {
				return new FooBox.Size(item.width, item.height);
			}
			// If all else fails... return (0, 0)
			return new FooBox.Size(0, 0);
		};

		/**
		 * This is called prior to displaying the item. You can perform various checks here to determine whether or not the item has changed since it's last display.
		 * @param {FooBox.Item} item - The item to check for changes.
		 * @returns {boolean} - True if the item has changed otherwise false.
		 */
		this.hasChanged = function () {
			return false;
		};

		/**
		 * Retrieves a url parameter value from the supplied url.
		 * @param {string} name - The name of the url parameter.
		 * @param {string} url - The url to retrieve the value from.
		 * @returns {string}
		 */
		this.getUrlVar = function (name, url) {
			name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
			var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
				results = regex.exec(url);
			return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, ' '));
		};

		/**
		 * Safely appends a url parameter value onto the end of the supplied url.
		 * @param {string} append - The key-value to append.
		 * @param {string} url - The url you want to append to.
		 * @returns {string}
		 */
		this.appendUrlVar = function (append, url) {
			var separator = url.indexOf('?') !== -1 ? '&' : '?';
			return url + separator + append;
		};
	};

	FooBox.handlers.register(FooBox.VideoHandler, defaults);

})(jQuery, window.FooBox);;/* jslint devel: true, browser: true, unparam: true, debug: false, es5: true, white: false, maxerr: 1000 */
/**!
 * FooBox Captions - An addon providing captions for the FooBox plugin
 * @version 2.0.0
 * @copyright Steven Usher & Brad Vincent 2013
 */
(function ($, FooBox) {

	/** @type {Object} - Contains the default option values for the caption addon. */
	var defaults = {
		/** @type {Object} - An object containing caption related options. */
		captions: {
			/** @type {string} - A String used to determine the type of animation to use when showing/hiding the caption. Available animations are 'slide', 'fade' and 'show'. */
			animation: 'slide',
			/** @type {boolean} - A Boolean indicating whether or not the captions feature is enabled. */
			enabled: true,
			/** @type {string} - A String used to determine how to find the description used for captions, the title attribute is interrogated for the value. Available options are 'find', 'image_find', 'image', 'image_alt', 'anchor' and 'none'. */
			descSource: 'find',
			/** @type {number} - A Number determining the amount of milliseconds to wait before showing the caption when the onlyShowOnHover option is set to true. If the mouse cursor exits the FooBox before this value the caption will not be shown at all. */
			hoverDelay: 300,
			/** @type {number} - A Number determining the maximum percentage the caption can occupy before the description is auto hidden. */
			maxHeight: 0.4,
			/** @type {boolean} - A Boolean indicating whether or not to only show the captions when hovering over the FooBox. */
			onlyShowOnHover: false,
			/** @type {boolean} - A Boolean indicating whether or not to only show the captions when clicking the FooBox. */
			onlyShowOnClick: false,
			/** @type {boolean} -  */
			overrideDesc: false,
			/** @type {boolean} -  */
			overrideTitle: false,
			/** @type {boolean} - A Boolean indicating whether or not to try 'prettify' the caption (removes dashes and trailing numbers and converts to sentence case). */
			prettify: false,
			/** @type {string} - A String used to determine how to find the title used for captions, the title attribute is interrogated for the value. Available options are 'find', 'image_find', 'image', 'image_alt', 'anchor' and 'none'. */
			titleSource: 'image_find'
		}
	};

	/**
	 * Extend the FooBox.Item with additional properties used by this addon.
	 */
	/** @type {boolean} - Whether or not this item allows captions to be displayed. */
	FooBox.Item.prototype.captions = false;
	/** @type {string} - The title of item. */
	FooBox.Item.prototype.title = null;
	/** @type {string} - The description of item. */
	FooBox.Item.prototype.description = null;
	/** @type {string} - The caption for the item. */
	FooBox.Item.prototype.caption = null;

	/**
	 * The core logic for the FooBox.Captions addon.
	 * @param {FooBox.Instance} instance - The parent FooBox instance for this addon.
	 * @constructor
	 */
	FooBox.Captions = function (instance) {

		/** @type {FooBox.Instance} - The parent FooBox instance for this addon. */
		this.FooBox = instance;
		/** @type {Object} - An object containing any timers required by this addon. */
		this.timers = {
			/** @type {FooBox.Timer} - A timer used to create a hover delay. */
			hover: new FooBox.Timer()
		};

		/**
		 * @type {FooBox.Captions} - Hold a reference to this instance of the object to avoid scoping issues.
		 * @private
		 */
		var _this = this;

		/**
		 * This method is called before the core FooBox plugin is created. This allows addons to bind to all events being raised, including those raised during initialization.
		 * @param {jQuery} element - The jQuery element the parent FooBox instance will be created and raising events on.
		 * @param {Object} options - The options used to initialize the FooBox instance.
		 */
		this.preinit = function (element) {
			_this.handlers.unbind(true);
			element.bind({
				'foobox.initialized foobox.reinitialized': _this.handlers.initialized,
				'foobox.setupHtml': _this.handlers.setupHtml,
				'foobox.setupOptions': _this.handlers.setupOptions,
				'foobox.parseItem': _this.handlers.parseItem,
				'foobox.onError': _this.handlers.onError
			});
		};

		/**
		 * This method is called when the core FooBox plugin is destroyed. This allows addons to unbind all events and remove any additional DOM elements added outside the modal.
		 */
		this.destroy = function() {
			_this.handlers.unbind(true);
		};

		/** @namespace - Contains all the event handlers used by this addon. */
		this.handlers = {
			/**
			 * This unbinds event handlers used by this addon.
			 * @param {boolean} [all=false] - Whether or not to unbind all handlers or just those used during init and reinit.
			 */
			unbind: function(all) {
				all = all || false;
				if (all){
					_this.FooBox.element.unbind({
						'foobox.initialized foobox.reinitialized': _this.handlers.initialized,
						'foobox.setupHtml': _this.handlers.setupHtml,
						'foobox.setupOptions': _this.handlers.setupOptions,
						'foobox.parseItem': _this.handlers.parseItem,
						'foobox.onError': _this.handlers.onError
					});
				}
				_this.FooBox.element.unbind({
					'foobox.beforeLoad': _this.handlers.beforeLoad,
					'foobox.afterLoad': _this.handlers.afterLoad,
					'foobox.closeOverlays': _this.handlers.closeOverlays
				});
				if (_this.FooBox.modal instanceof FooBox.Modal && FooBox.isjQuery(_this.FooBox.modal.element)){
					_this.FooBox.modal.element.undelegate('mouseenter.captions mouseleave.captions')
						.find('.fbx-item-current, .fbx-item-next')
						.unbind('click.captions');
				}
			},
			/**
			 * Handles the foobox.initialized event binding the various events needed by this addon to function.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			initialized: function (e) {
				_this.handlers.unbind();
				if (e.fb.options.captions.enabled === true) {
					e.fb.instance.element.bind({
						'foobox.beforeLoad': _this.handlers.beforeLoad,
						'foobox.afterLoad': _this.handlers.afterLoad,
						'foobox.closeOverlays': _this.handlers.closeOverlays
					});
					e.fb.modal.find('.fbx-item-current, .fbx-item-next').bind('click.captions', _this.handlers.toggleCaptions);
					if (e.fb.options.captions.onlyShowOnHover === true) {
						e.fb.modal.delegate('.fbx-inner:not(:has(.fbx-item-error))', 'mouseenter.captions', _this.handlers.mouseenter)
							.delegate('.fbx-inner:not(:has(.fbx-item-error))', 'mouseleave.captions', _this.handlers.mouseleave);
					}
				}
			},
			/**
			 * Handles the foobox.closeOverlays event.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			closeOverlays: function(e) {
				e.fb.modal.addClass('fbx-captions-hidden');
				_this.hide();
			},
			/**
			 * Handles the standard jQuery click event on the current item to toggle the captions.
			 * @param {jQuery.Event} e - A standard jQuery.Event object.
			 */
			toggleCaptions: function () {
				if (_this.FooBox.modal.element.hasClass('fbx-error')) { return true; }
				if (_this.FooBox.modal.element.find('.fbx-caption').is(':visible')) {
					_this.FooBox.modal.element.addClass('fbx-captions-hidden');
					_this.hide();
				} else {
					_this.FooBox.modal.element.removeClass('fbx-captions-hidden');
					_this.show();
				}
				return true;
			},
			/**
			 * Handles the standard jQuery mouseenter event.
			 * @param {jQuery.Event} e - A standard jQuery.Event object.
			 */
			mouseenter: function () {
				_this.timers.hover.start(function () {
					_this.show();
				}, _this.FooBox.options.captions.hoverDelay);
			},
			/**
			 * Handles the standard jQuery mouseleave event.
			 * @param {jQuery.Event} e - A standard jQuery.Event object.
			 */
			mouseleave: function () {
				_this.timers.hover.start(function () {
					_this.hide();
				}, _this.FooBox.options.captions.hoverDelay);
			},
			/**
			 * Handles the foobox.setupHtml event allowing this addon to create any required HTML.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			setupHtml: function (e) {
				if (typeof e.fb.options.modalClass == 'string' && e.fb.options.modalClass.indexOf('fbx-sticky-caption') != -1){
					e.fb.modal.append('<div class="fbx-caption"></div>');
				} else {
					e.fb.modal.find('.fbx-stage').append('<div class="fbx-caption"></div>');
				}
			},
			/**
			 * Handles the foobox.setupOptions event allowing this addon to set its initial starting state.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			setupOptions: function (e) {
				var display = e.fb.options.captions.enabled && !e.fb.options.captions.onlyShowOnHover ? '' : 'none';
				e.fb.modal.find('.fbx-caption').css('display', display);
			},
			/**
			 * Handles the foobox.beforeLoad event.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			beforeLoad: function (e) {
				if (e.fb.options.captions.onlyShowOnHover == true){	return;	}
				e.fb.modal.find('.fbx-caption').css('display', 'none');
			},
			/**
			 * Handles the foobox.afterLoad event.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			afterLoad: function (e) {
				var item = e.fb.item;
				
				if (item && !item.error && !item.captionLoaded) {
						e.fb.instance.raise('foobox.alterCaption', { 'element': e.fb.element, 'item': item });
						item.captionLoaded = true;
				}
				
				if (e.fb.options.captions.onlyShowOnHover == true){
					_this.update();
					return;
				}
				
				if (e.fb.options.captions.onlyShowOnClick == false){
					_this.show();
				}
			},
			/**
			 * Handles the foobox.onError event.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			onError: function (e) {
				e.fb.modal.find('.fbx-caption').css('display', 'none');
			},
			/**
			 * Handles the foobox.parseItem event.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			parseItem: function (e) {
				var opts = e.fb.options.captions;
				if (!e.fb.item.captions || opts.enabled == false) return;
				var caption = '', title, desc;
				if (e.fb.element != null) {
					var tSrc = $(e.fb.element).data('titleSource') || $(e.fb.instance.element).data('titleSource') || opts.titleSource,
						dSrc = $(e.fb.element).data('descSource') || $(e.fb.instance.element).data('descSource') || opts.descSource;

					title = e.fb.element.data('captionTitle') || _this.text(e.fb.element, tSrc);
					desc = e.fb.element.data('captionDesc') || _this.text(e.fb.element, dSrc);
				} else {
					title = e.fb.item.title;
					desc = e.fb.item.description;
				}

				// ensure working with strings
				title = title + '';
				desc = desc + '';

				if (title && title == desc) desc = null;

				caption = typeof title === 'string' && title.length > 0 ? FooBox.format('<div class="fbx-caption-title">{0}</div>', title) : caption;
				caption = typeof desc === 'string' && desc.length > 0 ? caption + FooBox.format('<div class="fbx-caption-desc">{0}</div>', desc) : caption;

				e.fb.item.title = title;
				e.fb.item.description = desc;
				e.fb.item.caption = caption;

				e.fb.instance.raise('foobox.createCaption', { 'element': e.fb.element, 'item': e.fb.item });
			}
		};

		/**
		 * Attempts to retrieve text from the supplied element using the method defined by source.
		 * @param {jQuery} element - The jQuery element to retrieve text from.
		 * @param {string} source - The source which defines how to retrieve the text from the element. Available options are 'find', 'image_find', 'image', 'image_alt', 'anchor' and 'none'.
		 * @returns {(string|null)} - null if no valid source is supplied.
		 */
		this.text = function (element, source) {
			var result;
			switch (source) {
				case 'find':
					result = $.trim(element.attr('title') || element.data('title') || element.find('img:first').attr('title') || element.find('img:first').attr('alt') || element.find('img:first').data('title') || element.find('img:first').data('alt'));
					break;
				case 'image_find':
					result = $.trim(element.find('img:first').attr('title') || element.find('img:first').attr('alt') || element.find('img:first').data('title') || element.find('img:first').data('alt'));
					break;
				case 'image':
					result = $.trim(element.find('img:first').attr('title') || element.find('img:first').data('title'));
					break;
				case 'image_alt':
					result = $.trim(element.find('img:first').attr('alt') || element.find('img:first').data('alt'));
					break;
				case 'anchor':
					result = $.trim(element.attr('title') || element.data('title'));
					break;
				default:
					result = null;
					break;
			}
			if (_this.FooBox.options.captions.prettify) {
				result = _this.prettifier(result);
			}
			return result;
		};

		/**
		 * Hides the caption taking into account the various options for animation.
		 */
		this.hide = function () {
			var item = _this.FooBox.items.current(),
				$caption = _this.FooBox.modal.element.find('.fbx-caption');

			if (!_this.FooBox.options.captions.enabled || !item.captions || typeof item.caption != 'string' || item.caption.length == 0) {
				$caption.css('display', 'none');
				return;
			}
			switch (_this.FooBox.options.captions.animation) {
				case 'fade':
					$caption.stop(true, true).fadeOut(400);
					break;
				case 'slide':
					$caption.stop(true, true).slideUp(400);
					break;
				default:
					$caption.css('display', 'none');
					break;
			}
		};

		/**
		 * Shows the caption taking into account the various options for animation as well as parsing the caption for foobox enabled links.
		 */
		this.show = function () {
			var _fb = _this.FooBox,
				item = _fb.items.current(),
				$caption = _fb.modal.element.find('.fbx-caption');

			if (!_fb.options.captions.enabled || !item.captions || typeof item.caption != 'string' || item.caption.length == 0 || _fb.modal.element.hasClass('fbx-captions-hidden') || (FooBox.isjQuery(item.element) && item.element.hasClass('no-captions'))) {
				$caption.css('display', 'none');
				return;
			}

			_this.update();

			switch (_fb.options.captions.animation) {
				case 'fade':
					$caption.stop(true, true).fadeIn(500);
					break;
				case 'slide':
					$caption.stop(true, true).slideDown(500);
					break;
				default:
					$caption.css('display', '');
					break;
			}
		};

		this.update = function() {
			var item = _this.FooBox.items.current(),
				$caption = _this.FooBox.modal.element.find('.fbx-caption');

			$caption.html(item.caption)
				.find('a[href^="#"]')
				.filter(function () {
					var identifier = $(this).attr('href'), target = $(identifier), fbx = target.data('fbx_instance') || target.data('fbx_p_instance');
					if (target.length > 0 && fbx instanceof FooBox.Instance) {
						$(this).data('hrefTarget', target.get(0));
						return true;
					}
					return false;
				})
				.unbind('click.captions')
				.bind('click.captions', function (e) {
					e.preventDefault();
					var target = $(this).data('hrefTarget');
					var fbx = $(target).data('fbx_instance') || $(target).data('fbx_p_instance');
					if (fbx instanceof FooBox.Instance) {
						_this.FooBox.modal.close();
						fbx.items.indexes.set(target.index);
						fbx.modal.show();
					}
					return false;
				});

			$('<a href="#close_overlays" class="fbx-close-overlays">&times;</a>').bind('click.captions',function (e) {
				e.preventDefault();
				_this.FooBox.raise('foobox.closeOverlays');
				return false;
			}).prependTo($caption);
		};

		/**
		 * Attempts to 'prettify' the caption, removes dashes and trailing numbers and converts to sentence case.
		 * @param {string} text - The text to 'prettify'.
		 * @returns {string} - The 'prettified' version of the string.
		 */
		this.prettifier = function (text) {
			if (typeof text !== 'string') return null;
			text = text.replace(/\s*-\d+/g, '').replace(/\s*_\d+/g, '').replace(/-/g, ' ').replace(/_/g, ' ');
			text = text.replace(/\w\S*/g, function (txt) {
				if (txt.indexOf('#') != -1) {
					return txt; // fix to leave an id selector href as it was (id's are case sensitive so changing anything breaks the selector)
				}
				return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
			});
			return text;
		};
	};

	FooBox.addons.register(FooBox.Captions, defaults);

})(jQuery, window.FooBox);;/* jslint devel: true, browser: true, unparam: true, debug: false, es5: true, white: false, maxerr: 1000 */
/**!
 * FooBox Deeplinking - An addon providing deeplinking URL support for the FooBox plugin
 * @version 2.0.0
 * @copyright Steven Usher & Brad Vincent 2013
 */
(function ($, FooBox) {

	/** @type {Object} - Contains the default option values for the deeplinking addon. */
	var defaults = {
		/** @type {Object} - An object containing deeplinking related options. */
		deeplinking: {
			/** @type {boolean} - A Boolean indicating whether or not the deeplinking feature is enabled. */
			enabled: true,
			/** @type {string} - A String prefix used for the creating of hash tags. */
			prefix: 'foobox'
		}
	};

	/**
	 * Extend the FooBox.Item with additional properties used by this addon.
	 */
	/** @type {string} - The deeplink appended to the url for the item. */
	FooBox.Item.prototype.deeplink = null;

	/** @type {boolean} - A Boolean value indicating whether or not a deeplink has been set. */
	FooBox.isDeepLink = false;
	
	FooBox.hashBang = '#';

	/**
	 * The core logic for the FooBox.DeepLinking addon.
	 * @param {FooBox.Instance} instance - The parent FooBox instance for this addon.
	 * @constructor
	 */
	FooBox.DeepLinking = function (instance) {
		/** @type {FooBox.Instance} - The parent FooBox instance for this addon. */
		this.FooBox = instance;
		/** @type {Object} - An object containing any timers required by this addon. */
		this.timers = {
			/** @type {FooBox.Timer} - A timer used to create a hover delay. */
			display: new FooBox.Timer()
		};

		/**
		 * @type {FooBox.DeepLinking} - Hold a reference to this instance of the object to avoid scoping issues.
		 * @private
		 */
		var _this = this;

		/**
		 * This method is called before the core FooBox plugin is created. This allows addons to bind to all events being raised, including those raised during initialization.
		 * @param {jQuery} element - The jQuery element the parent FooBox instance will be created and raising events on.
		 * @param {Object} options - The options used to initialize the FooBox instance.
		 */
		this.preinit = function (element) {
			_this.handlers.unbind(true);
			element.bind({
				'foobox.initialized foobox.reinitialized': _this.handlers.initialized,
				'foobox.parseItem': _this.handlers.parseItem
			});
		};

		/**
		 * This method is called when the core FooBox plugin is destroyed. This allows addons to unbind all events and remove any additional DOM elements added outside the modal.
		 */
		this.destroy = function(){
			_this.handlers.unbind(true);
		};

		/** @namespace - Contains all the event handlers used by this addon. */
		this.handlers = {
			/**
			 * This unbinds event handlers used by this addon.
			 * @param {boolean} [all=false] - Whether or not to unbind all handlers or just those used during init and reinit.
			 */
			unbind: function(all){
				all = all || false;
				if (all){
					_this.FooBox.element.unbind({
						'foobox.initialized foobox.reinitialized': _this.handlers.initialized,
						'foobox.parseItem': _this.handlers.parseItem
					});
				}
				_this.FooBox.element.unbind({
					'foobox.afterLoad': _this.handlers.afterLoad,
					'foobox.close': _this.handlers.close
				});
			},
			/**
			 * Handles the foobox.initialized event binding the various events needed by this addon to function.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			initialized: function (e) {
				_this.handlers.unbind();
				if (e.fb.options.deeplinking.enabled === true) {
					e.fb.instance.element.bind({
						'foobox.afterLoad': _this.handlers.afterLoad,
						'foobox.close': _this.handlers.close
					});
					var hash = _this.hash.get();
					if (hash && _this.FooBox.id == hash.id) {
						var item = _this.FooBox.items.array[hash.index];
						if (!item) return;
						FooBox.isDeepLink = true;
						_this.FooBox.raise('foobox.hasHash', { 'item': item });
						_this.timers.display.start(function () {
							_this.FooBox.items.indexes.set(item.index);
							_this.FooBox.modal.show(true);
						}, 100);
					}
				}
			},
			/**
			 * Handles the foobox.parseItem event.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			parseItem: function(e){
				if (e.fb.options.deeplinking.enabled != true) return;
				switch(e.fb.item.type){
					case 'image':
						if (e.fb.item.url.match(/.*\/(.*)$/)) {
							e.fb.item.deeplink = e.fb.item.url.match(/.*\/(.*)$/)[1];
						}
						break;
					case 'html':
						e.fb.item.deeplink = e.fb.item.selector.replace(FooBox.hashBang, '');
						break;
					case 'video':
						e.fb.item.deeplink = e.fb.item.video_id;
						break;
				}
			},
			/**
			 * Handles the foobox.afterLoad event.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			afterLoad: function () {
				_this.hash.set();
			},
			/**
			 * Handles the foobox.close event.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			close: function () {
				_this.hash.clear();
			}
		};

		/** @namespace - Contains all the getter/setter logic for the hash value. */
		this.hash = {
			/**
			 * Retrieves the current hash values from the url if one exists.
			 * @returns {Object}
			 */
			get: function () {
				if (location.hash.indexOf(FooBox.hashBang + _this.FooBox.options.deeplinking.prefix) === -1) { return null; }

				var hash = location.hash;
				if (hash.substr(-1) == '/') { hash = hash.substr(0, hash.length - 1); }

				var regex = hash.match(/\/([^\/]+)\/?([^\/]+)?$/);
				var index = regex[1],
					name = regex[2],
					actual = -1;

				//first, try to get the item index based on the item name
				if (typeof name == 'string') {
					$.each(_this.FooBox.items.array, function (i, item) {
						if (item.deeplink && item.deeplink === name) {
							actual = i;
							return false;
						}
						return true;
					});
				}

				if (actual == -1) { actual = index; }

				var id = hash.substring(0, hash.indexOf('/'));
				id = id.replace(FooBox.hashBang + _this.FooBox.options.deeplinking.prefix + '-', '');

				return { id: id, index: actual };
			},
			/**
			 * Sets a new hash value on the URL using the current item.
			 */
			set: function () {
				var item = _this.FooBox.items.current(),
					hash = _this.FooBox.options.deeplinking.prefix + '-' + _this.FooBox.id + '/' + item.index,
					deeplink = item.deeplink;
				if (deeplink) { hash += '/' + deeplink; }
				var url = ('' + window.location).split(FooBox.hashBang)[0] + FooBox.hashBang + hash;
				if (window.history && window.history.replaceState){
					window.history.replaceState(null, document.title, url);
				} else {
					window.location.replace(url);
				}
			},
			/**
			 * Clears the hash value from the URL.
			 */
			clear: function () {
				if (window.history && window.history.replaceState){
					var url = window.location.pathname;
					url += (typeof window.location.search === 'string' && window.location.search !== '') ? (window.location.search.substring(0,1) === '?'
						? window.location.search
						: '?'+window.location.search) : '';
					window.history.replaceState(null, document.title, url);
				} else {
					window.location.replace(('' + window.location).split(FooBox.hashBang)[0] + FooBox.hashBang + '/');
				}
			}
		};
	};

	FooBox.addons.register(FooBox.DeepLinking, defaults);

})(jQuery, window.FooBox);;/* jslint devel: true, browser: true, unparam: true, debug: false, es5: true, white: false, maxerr: 1000 */
/**!
 * FooBox Events - An addon providing providing backwards compatibility support for the FooBox V2 plugin by raising V1 events
 * @version 2.0.0
 * @copyright Steven Usher & Brad Vincent 2013
 */
(function ($, FooBox) {

	/**
	 * The core logic for the FooBox.Events addon.
	 * @param {FooBox.Instance} instance - The parent FooBox instance for this addon.
	 * @constructor
	 */
	FooBox.Events = function (instance) {

		/** @type {FooBox.Instance} - The parent FooBox instance for this addon. */
		this.FooBox = instance;

		/**
		 * @type {FooBox.Events} - Hold a reference to this instance of the object to avoid scoping issues.
		 * @private
		 */
		var _this = this;

		/**
		 * This method is called before the core FooBox plugin is created. This allows addons to bind to all events being raised, including those raised during initialization.
		 * @param {jQuery} element - The jQuery element the parent FooBox instance will be created and raising events on.
		 * @param {Object} options - The options used to initialize the FooBox instance.
		 */
		this.preinit = function (element) {
			_this.handlers.unbind();
			element.bind({
				'foobox.afterLoad': _this.handlers.foobox_image_onload,
				'foobox.beforeLoad': _this.handlers.foobox_image_custom_caption
			});
		};

		/**
		 * This method is called when the core FooBox plugin is destroyed. This allows addons to unbind all events and remove any additional DOM elements added outside the modal.
		 */
		this.destroy = function(){
			_this.handlers.unbind();
		};

		this.raise = function (eventName, args) {
			args = args || {};
			var e = $.Event(eventName);
			//pre jQuery 1.6 did not allow data to be passed to the event object constructor so extend instead
			$.extend(true, e, args);
			_this.FooBox.element.trigger(e);
			return e;
		};

		this.handlers = {
			unbind: function(){
				_this.FooBox.element.unbind({
					'foobox.afterLoad': _this.handlers.foobox_image_onload,
					'foobox.beforeLoad': _this.handlers.foobox_image_custom_caption
				});
			},
			foobox_image_onload: function (e) {
				if (e.fb.item.type == 'image'){
					_this.raise('foobox_image_onload', { thumb: { jq: e.fb.item.element, target: e.fb.item.url } });
				}
			},
			foobox_image_custom_caption: function (e) {
				var ne = _this.raise('foobox_image_custom_caption', { thumb: e.fb.item.element, title: e.fb.item.title, desc: e.fb.item.description, handled: false });
				if (ne.handled == true) {
					e.fb.item.title = ne.title;
					e.fb.item.description = ne.desc;
					var caption = typeof e.fb.item.title === 'string' && e.fb.item.title.length > 0 ? FooBox.format('<div class="fbx-caption-title">{0}</div>', e.fb.item.title) : '';
					caption = typeof e.fb.item.description === 'string' && e.fb.item.description.length > 0 ? caption + FooBox.format('<div class="fbx-caption-desc">{0}</div>', e.fb.item.description) : caption;
					e.fb.item.caption = caption;
				}
			}
		};
	};

	FooBox.addons.register(FooBox.Events);

})(jQuery, window.FooBox);;/* jslint devel: true, browser: true, unparam: true, debug: false, es5: true, white: false, maxerr: 1000 */
/**!
 * FooBox Fullscreen - An addon providing fullscreen support for the FooBox plugin
 * @version 2.0.0
 * @copyright Steven Usher & Brad Vincent 2013
 */
(function ($, FooBox) {

	/** @type {Object} - Contains the default option values for the fullscreen addon. */
	var defaults = {
		/** @type {Object} - An object containing fullscreen related options. */
		fullscreen: {
			/** @type {boolean} - A Boolean indicating whether or not the fullscreen feature is enabled. */
			enabled: false,
			/** @type {boolean} -  */
			force: false,
			/** @type {boolean} - A Boolean indicating whether or not to attempt to use the browser specific API to control fullscreen functionality. If set to false FooBox will simply fill the available browser window. */
			useAPI: true
		}
	};

	/**
	 * Extend the FooBox.Item with additional properties used by this addon.
	 */
	/** @type {boolean} - Whether or not this item is allowed in fullscreen mode. */
	FooBox.Item.prototype.fullscreen = false;

	/**
	 * The core logic for the FooBox.Fullscreen addon.
	 * @param {FooBox.Instance} instance - The parent FooBox instance for this addon.
	 * @constructor
	 */
	FooBox.Fullscreen = function (instance) {

		/** @type {FooBox.Instance} - The parent FooBox instance for this addon. */
		this.FooBox = instance;

		/**
		 * @type {FooBox.Fullscreen} - Hold a reference to this instance of the object to avoid scoping issues.
		 * @private
		 */
		var _this = this;

		/**
		 * This method is called before the core FooBox plugin is created. This allows addons to bind to all events being raised, including those raised during initialization.
		 * @param {jQuery} element - The jQuery element the parent FooBox instance will be created and raising events on.
		 * @param {Object} options - The options used to initialize the FooBox instance.
		 */
		this.preinit = function (element) {
			_this.handlers.unbind(true);
			element.bind({
				'foobox.initialized foobox.reinitialized': _this.handlers.initialized,
				'foobox.setupHtml': _this.handlers.setupHtml,
				'foobox.setupOptions': _this.handlers.setupOptions
			});
		};

		/**
		 * This method is called when the core FooBox plugin is destroyed. This allows addons to unbind all events and remove any additional DOM elements added outside the modal.
		 */
		this.destroy = function(){
			_this.handlers.unbind(true);
		};

		/** @namespace - Contains all the event handlers used by this addon. */
		this.handlers = {
			/**
			 * This unbinds event handlers used by this addon.
			 * @param {boolean} [all=false] - Whether or not to unbind all handlers or just those used during init and reinit.
			 */
			unbind: function(all){
				all = all || false;
				if (all){
					_this.FooBox.element.unbind({
						'foobox.initialized foobox.reinitialized': _this.handlers.initialized,
						'foobox.setupHtml': _this.handlers.setupHtml,
						'foobox.setupOptions': _this.handlers.setupOptions
					});
				}
				_this.FooBox.element.unbind({
					'foobox.afterShow': _this.handlers.afterShow,
					'foobox.beforeLoad': _this.handlers.beforeLoad,
					'foobox.keydown': _this.handlers.onKeydown,
					'foobox.close': _this.handlers.onClose
				});
				if (_this.FooBox.modal instanceof FooBox.Modal && FooBox.isjQuery(_this.FooBox.modal.element)){
					_this.FooBox.modal.element.find('.fbx-fullscreen-toggle').unbind('click.fullscreen', _this.handlers.onClick);
				}
				$(document).unbind('webkitfullscreenchange mozfullscreenchange fullscreenchange', _this.handlers.onFullscreenChange)
					.bind('webkitfullscreenchange mozfullscreenchange fullscreenchange', _this.handlers.onFullscreenChange);
			},
			/**
			 * Handles the foobox.initialized event binding the various events needed by this addon to function.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			initialized: function (e) {
				_this.handlers.unbind();

				e.fb.options.fullscreen.enabled = typeof e.fb.instance.element.data('fullscreenEnabled') == 'boolean'
					? e.fb.instance.element.data('fullscreenEnabled') : e.fb.options.fullscreen.enabled;

				e.fb.options.fullscreen.force = typeof e.fb.instance.element.data('fullscreenForce') == 'boolean'
					? e.fb.instance.element.data('fullscreenForce') : e.fb.options.fullscreen.force;

				e.fb.options.fullscreen.useAPI = typeof e.fb.instance.element.data('fullscreenAPI') == 'boolean'
					? e.fb.instance.element.data('fullscreenAPI') : e.fb.options.fullscreen.useAPI;

				if (e.fb.options.fullscreen.enabled === true) {
					e.fb.instance.element.bind({
						'foobox.beforeLoad': _this.handlers.beforeLoad,
						'foobox.afterShow': _this.handlers.afterShow,
						'foobox.afterResize': _this.handlers.afterResize,
						'foobox.keydown': _this.handlers.onKeydown,
						'foobox.close': _this.handlers.onClose
					});
					e.fb.modal.find('.fbx-fullscreen-toggle').bind('click.fullscreen', _this.handlers.onClick);
				}
			},
			/**
			 * Handles the foobox.setupHtml event allowing this addon to create any required HTML.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			setupHtml: function (e) {
				e.fb.modal.find('.fbx-inner').append('<a href="#fullscreen" class="fbx-fullscreen-toggle fbx-btn-transition fbx-btn-shadow"></a>');
			},
			/**
			 * Handles the foobox.setupOptions event allowing this addon to set its initial starting state.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			setupOptions: function (e) {
				if (e.fb.options.fullscreen.enabled == true) { e.fb.modal.addClass('fbx-fullscreen'); }
				else { e.fb.modal.removeClass('fbx-fullscreen'); }
				if (e.fb.options.fullscreen.force == true) {
					e.fb.modal.find('.fbx-fullscreen-toggle').hide();
				}
			},
			/**
			 * Handles the foobox.afterShow event.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			afterShow: function (e) {
				if (e.fb.options.fullscreen.force === true && !e.fb.modal.hasClass('fbx-phone')) {
					_this.FooBox.modal.element.addClass('fbx-fullscreen').find('.fbx-fullscreen-toggle').hide();
					if (!e.fb.modal.hasClass('fbx-fullscreen-mode')){
						_this.fullscreen.launch();
					}
				}
			},
			/**
			 * Handles the foobox.afterResize event.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			afterResize: function (e) {
				if (e.fb.modal.hasClass('fbx-phone')) {
					e.fb.modal.removeClass('fbx-fullscreen').find('.fbx-fullscreen-toggle').hide();
					if (e.fb.modal.hasClass('fbx-fullscreen-mode')){
						_this.fullscreen.cancel();
					}
				} else if (e.fb.options.fullscreen.force === true) {
					_this.FooBox.modal.element.addClass('fbx-fullscreen').find('.fbx-fullscreen-toggle').hide();
					if (!e.fb.modal.hasClass('fbx-fullscreen-mode')){
						_this.fullscreen.launch();
					}
				} else {
					e.fb.modal.addClass('fbx-fullscreen').find('.fbx-fullscreen-toggle').show();
				}
			},
			/**
			 * Handles the foobox.beforeLoad event.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			beforeLoad: function (e) {
				if (e.fb.modal.hasClass('fbx-fullscreen-mode') && e.fb.item.fullscreen != true) {
					e.preventDefault();
					switch (e.fb.instance.items.indexes.direction) {
						case '<':
							e.fb.instance.modal.prev();
							break;
						default:
							e.fb.instance.modal.next();
							break;
					}
				} else if (e.fb.item.fullscreen != true || e.fb.modal.hasClass('fbx-phone')) {
					e.fb.modal.removeClass('fbx-fullscreen').find('.fbx-fullscreen-toggle').hide();
				} else if (e.fb.options.fullscreen.force === true) {
					e.fb.modal.find('.fbx-fullscreen-toggle').hide();
				} else {
					e.fb.modal.addClass('fbx-fullscreen').find('.fbx-fullscreen-toggle').show();
				}
			},
			/**
			 * Handles the standard jQuery click event toggle the between fullscreen and normal modes.
			 * @param {jQuery.Event} e - A standard jQuery.Event object.
			 */
			onClick: function (e) {
				e.preventDefault();
				if (_this.FooBox.modal.element.hasClass('fbx-fullscreen-mode')) { _this.fullscreen.cancel(); }
				else { _this.fullscreen.launch(); }
				return false;
			},
			/**
			 * Handles the foobox.close event.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			onClose: function () {
				_this.fullscreen.cancel();
			},
			/**
			 * Handles the foobox.keydown event.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			onKeydown: function (e) {
				if (e.fb.modal.hasClass('fbx-fullscreen-mode') && e.fb.keyCode == 27) {
					_this.fullscreen.cancel();
					if (e.fb.options.fullscreen.force == true){
						e.fb.instance.modal.close();
					}
				}
			},
			/**
			 * Handles the fullscreenchange event to toggle between fullscreen and normal modes.
			 * @param {jQuery.Event} e - A standard jQuery.Event object.
			 */
			onFullscreenChange: function () {
				if (document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen) {
					_this.fullscreen.apply();
				} else {
					_this.fullscreen.remove();
				}
			}
		};

		/** @namespace - Contains the launch/cancel logic for the fullscreen feature. */
		this.fullscreen = {
			/**
			 * Launches the fullscreen mode for FooBox using the built in browser API's if required.
			 */
			launch: function () {
				if (_this.FooBox.options.fullscreen.useAPI == true && _this.FooBox.options.fullscreen.force == false && !(FooBox.browser.isSafari && FooBox.browser.Mac)) {
					var modal = _this.FooBox.modal.element.get(0);
					if (modal.requestFullScreen) { modal.requestFullScreen(); }
					else if (modal.mozRequestFullScreen) { modal.mozRequestFullScreen(); }
					else if (modal.webkitRequestFullScreen) { modal.webkitRequestFullScreen(); }
					else { _this.fullscreen.apply(); }
				} else {
					_this.fullscreen.apply();
				}
			},
			/**
			 * Cancels the current fullscreen mode for FooBox using the built in browser API's if required.
			 */
			cancel: function () {
				if (!_this.FooBox.modal.element.hasClass('fbx-fullscreen-mode')) { return; }
				if (_this.FooBox.options.fullscreen.useAPI == true && _this.FooBox.options.fullscreen.force == false && !(FooBox.browser.isSafari && FooBox.browser.Mac)) {
					if (document.cancelFullScreen) { document.cancelFullScreen(); }
					else if (document.mozCancelFullScreen) { document.mozCancelFullScreen(); }
					else if (document.webkitCancelFullScreen) { document.webkitCancelFullScreen(); }
					else { _this.fullscreen.remove(); }
				} else {
					_this.fullscreen.remove();
				}
			},
			/**
			 * Applies the CSS styles and sets the state for fullscreen mode.
			 */
			apply: function () {
				var item = _this.FooBox.items.current();
				if (item){
					_this.FooBox.modal.element.addClass('fbx-fullscreen-mode');
					_this.FooBox.modal.resize(item.handler.getSize(item));
				}
				_this.FooBox.raise('foobox.fullscreenEnabled');
			},
			/**
			 * Removes the CSS styles and sets the state for normal mode.
			 */
			remove: function () {
				var item = _this.FooBox.items.current();
				if (item){
					_this.FooBox.modal.element.removeClass('fbx-fullscreen-mode');
					_this.FooBox.modal.resize(item.handler.getSize(item));
				}
				_this.FooBox.raise('foobox.fullscreenDisabled');
			}
		};
	};

	FooBox.addons.register(FooBox.Fullscreen, defaults);

})(jQuery, window.FooBox);;/* jslint devel: true, browser: true, unparam: true, debug: false, es5: true, white: false, maxerr: 1000 */
/**!
 * FooBox FX - An addon providing extra effects for the FooBox plugin
 * @version 0.0.1
 * @copyright Steven Usher & Brad Vincent 2013
 */
(function ($, FooBox) {

	/** @type {Object} - Contains the default option values for the addon. */
	var defaults = {
		effect: null
	};

	/**
	 * The core logic for the FooBox.FX addon.
	 * @param {FooBox.Instance} instance - The parent FooBox instance for this addon.
	 * @constructor
	 */
	FooBox.FX = function(instance) {

		/** @type {FooBox.Instance} - The parent FooBox instance for this addon. */
		this.FooBox = instance;

		/**
		 * @type {FooBox.FX} - Hold a reference to this instance of the object to avoid scoping issues.
		 * @private
		 */
		var _this = this;

		/**
		 * This method is called before the core FooBox plugin is created. This allows addons to bind to all events being raised, including those raised during initialization.
		 * @param {jQuery} element - The jQuery element the parent FooBox instance will be created and raising events on.
		 * @param {Object} options - The options used to initialize the FooBox instance.
		 */
		this.preinit = function (element) {
			_this.handlers.unbind(true);
			element.bind({
				'foobox.initialized foobox.reinitialized': _this.handlers.initialized,
				'foobox.setupOptions': _this.handlers.setupOptions
			});
		};

		/**
		 * This method is called when the core FooBox plugin is destroyed. This allows addons to unbind all events and remove any additional DOM elements added outside the modal.
		 */
		this.destroy = function() {
			_this.handlers.unbind(true);
		};

		this.handlers = {
			/**
			 * This unbinds event handlers used by this addon.
			 * @param {boolean} [all=false] - Whether or not to unbind all handlers or just those used during init and reinit.
			 */
			unbind: function(all) {
				all = all || false;
				if (all){
					_this.FooBox.element.unbind({
						'foobox.initialized foobox.reinitialized': _this.handlers.initialized,
						'foobox.setupOptions': _this.handlers.setupOptions
					});
				}
				_this.FooBox.element.unbind({
					'foobox.afterResize': _this.handlers.afterResize,
					'foobox.beforeShow': _this.handlers.beforeShow,
					'foobox.beforeClose': _this.handlers.beforeClose
				});
			},
			/**
			 * Handles the foobox.initialized event binding the various events needed by this addon to function.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			initialized: function (e) {
				_this.handlers.unbind();
				if (FooBox.browser.supportsTransitions() && typeof _this.FooBox.options.effect == 'string'){
					e.fb.instance.element.bind({
						'foobox.afterResize': _this.handlers.afterResize,
						'foobox.beforeShow': _this.handlers.beforeShow,
						'foobox.beforeClose': _this.handlers.beforeClose
					});
				}
			},
			/**
			 * Handles the foobox.setupOptions event allowing this addon to set its initial starting state.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			setupOptions: function (e) {
				if ( _this.FooBox.element.data('effect') ) {
					_this.FooBox.options.effect = _this.FooBox.element.data('effect');
				}
				if (FooBox.browser.supportsTransitions() && typeof _this.FooBox.options.effect == 'string'){
					e.fb.modal.addClass('fbx-effects').addClass(e.fb.options.effect);
				}
			},
			afterResize: function(e){
				// handle moving the buttons around if required.
				var $inner = $('.fbx-inner', e.fb.modal),
					isStickyButtons = e.fb.modal.hasClass('fbx-sticky-buttons'),
					isStickyCaptions = e.fb.modal.hasClass('fbx-sticky-caption'),
					isPhone = e.fb.modal.hasClass('fbx-phone'),
					isFullscreen = e.fb.modal.hasClass('fbx-fullscreen-mode');
				if (isStickyButtons || isPhone || isFullscreen){
					if (isPhone || isFullscreen){
						e.fb.modal.find('.fbx-close').insertAfter($inner);
						e.fb.modal.find('.fbx-play,.fbx-pause').insertAfter($inner);
						e.fb.modal.find('.fbx-fullscreen-toggle').insertBefore($inner);
						if (isPhone){
							e.fb.modal.find('.fbx-social-toggle,.fbx-social').insertAfter($inner);
						} else {
							e.fb.modal.find('.fbx-social-toggle,.fbx-social').appendTo($inner);
						}
					} else {
						e.fb.modal.find('.fbx-close').appendTo($inner);
						e.fb.modal.find('.fbx-play,.fbx-pause').appendTo($inner);
						e.fb.modal.find('.fbx-fullscreen-toggle').prependTo($inner);
						e.fb.modal.find('.fbx-social-toggle,.fbx-social').appendTo($inner);
					}
					e.fb.modal.find('.fbx-prev').insertBefore($inner);
					e.fb.modal.find('.fbx-next').insertAfter($inner);
				} else {
					e.fb.modal.find('.fbx-close').appendTo($inner);
					e.fb.modal.find('.fbx-play,.fbx-pause').appendTo($inner);
					e.fb.modal.find('.fbx-fullscreen-toggle').prependTo($inner);
					e.fb.modal.find('.fbx-prev').prependTo($inner);
					e.fb.modal.find('.fbx-next').appendTo($inner);
					e.fb.modal.find('.fbx-social-toggle,.fbx-social').appendTo($inner);
				}
				// handle moving the caption around if required.
				if (isStickyCaptions || isPhone || isFullscreen){
					e.fb.modal.find('.fbx-caption').appendTo(e.fb.modal);
				} else {
					e.fb.modal.find('.fbx-caption').appendTo(e.fb.modal.find('.fbx-stage'));
				}
			},
			/**
			 * Handles the foobox.beforeShow event allowing this addon to override the default function.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			beforeShow: function(e){
				e.preventDefault();
				e.fb.modal.removeClass('fbx-loading').addClass('fbx-show').one(FooBox.browser.transitionEnd(), function(){
					e.fb.instance.raise('foobox.afterShow', { 'item': e.fb.item });
					e.fb.instance.raise('foobox.afterLoad', { 'item': e.fb.item });
					e.fb.instance.modal._busy = false;
				}).addClass('fbx-animate');
			},
			/**
			 * Handles the foobox.beforeClose event allowing this addon to override the default function.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			beforeClose: function(e){
				e.preventDefault();
				function close(){
					e.fb.instance.modal._closed = true;
					e.fb.instance.modal._busy = false;
					$('body').removeClass('fbx-active');
					e.fb.instance.raise('foobox.close');
					e.fb.modal.removeClass('fbx-loading fbx-show').find('.fbx-item-current, .fbx-item-next').empty();
					if (e.fb.options.hideScrollbars) { $('body,html').css('overflow', ''); }
					e.fb.instance.raise('foobox.afterClose');
				}
				if (e.fb.modal.hasClass('fbx-animate')) e.fb.modal.one(FooBox.browser.transitionEnd(), close).removeClass('fbx-animate');
				else close();
			}
		};
	};

	FooBox.addons.register(FooBox.FX, defaults);

})(jQuery, window.FooBox);;/* jslint devel: true, browser: true, unparam: true, debug: false, es5: true, white: false, maxerr: 1000 */
/**!
 * FooBox Keyboard - An addon providing simple keyboard support for the FooBox plugin
 * @version 2.0.0
 * @copyright Steven Usher & Brad Vincent 2013
 */
(function ($, FooBox) {

	var defaults = {
		keyboard: {
			enabled: true,
			preventDefault: false,
			stopPropagation: false
		}
	};

	/**
	 * The core logic for the FooBox.Keyboard addon.
	 * @param {FooBox.Instance} instance - The parent FooBox instance for this addon.
	 * @constructor
	 */
	FooBox.Keyboard = function (instance) {

		/** @type {FooBox.Instance} - The parent FooBox instance for this addon. */
		this.FooBox = instance;

		/**
		 * @type {FooBox.Keyboard} - Hold a reference to this instance of the object to avoid scoping issues.
		 * @private
		 */
		var _this = this;

		/**
		 * This method is called before the core FooBox plugin is created. This allows addons to bind to all events being raised, including those raised during initialization.
		 * @param {jQuery} element - The jQuery element the parent FooBox instance will be created and raising events on.
		 * @param {Object} options - The options used to initialize the FooBox instance.
		 */
		this.preinit = function (element) {
			_this.handlers.unbind(true);
			element.bind({
				'foobox.initialized foobox.reinitialized': _this.handlers.initialized,
				'foobox.setupHtml': _this.handlers.setupHtml
			});
		};

		/**
		 * This method is called when the core FooBox plugin is destroyed. This allows addons to unbind all events and remove any additional DOM elements added outside the modal.
		 */
		this.destroy = function(){
			_this.handlers.unbind(true);
		};

		/** @namespace - Contains all the event handlers used by this addon. */
		this.handlers = {
			/**
			 * This unbinds event handlers used by this addon.
			 * @param {boolean} [all=false] - Whether or not to unbind all handlers or just those used during init and reinit.
			 */
			unbind: function(all){
				all = all || false;
				if (all){
					_this.FooBox.element.unbind({
						'foobox.initialized foobox.reinitialized': _this.handlers.initialized,
						'foobox.setupHtml': _this.handlers.setupHtml
					});
				}
				_this.FooBox.element.unbind('foobox.afterLoad', _this.handlers.afterLoad);
				if (FooBox.isjQuery(_this.FooBox.modal.element)){
					_this.FooBox.modal.element.unbind('keydown.foobox', _this.handlers.onKeydown);
				}
			},
			/**
			 * Handles the foobox.initialized event binding the various events needed by this addon to function.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			initialized: function () {
				_this.handlers.unbind();
				if (_this.FooBox.options.keyboard.enabled == true){
					_this.FooBox.element.bind('foobox.afterLoad', _this.handlers.afterLoad);
					if (FooBox.isjQuery(_this.FooBox.modal.element)){
						_this.FooBox.modal.element.bind('keydown.foobox', _this.handlers.onKeydown);
					}
				}
			},
			/**
			 * Handles the foobox.setupHtml event allowing this addon to create any required HTML.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			setupHtml: function (e) {
				e.fb.modal.attr('tabindex', 0);
			},
			/**
			 * Handles the foobox.afterLoad event allowing this addon to focus the modal to enable capturing of key events.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			afterLoad: function (e) {
				e.fb.modal.focus();
			},
			/**
			 * Handles the standard jQuery keydown event.
			 * @param {jQuery.Event} e - A standard jQuery.Event object.
			 */
			onKeydown: function (e) {
				var modal = _this.FooBox.modal, options = _this.FooBox.options.keyboard;
				if (modal.element.hasClass('fbx-show')) {
					if (!modal.element.hasClass('fbx-fullscreen-mode') && e.which === 27) {
						modal.close();
					} else if (_this.FooBox.items.multiple() && e.which === 37) {
						modal.prev();
					} else if (_this.FooBox.items.multiple() && e.which === 39) {
						modal.next();
					}
					if (options.preventDefault == true){ e.preventDefault(); }
					if (options.stopPropagation == true){ e.stopPropagation(); }
					_this.FooBox.raise('foobox.keydown', { 'keyCode': e.which });
				}
			}
		};
	};

	FooBox.addons.register(FooBox.Keyboard, defaults);

})(jQuery, window.FooBox);;/* jslint devel: true, browser: true, unparam: true, debug: false, es5: true, white: false, maxerr: 1000 */
/**!
 * FooBox Responsive (REQUIRED) - An addon providing responsive support for the FooBox plugin.
 * This addon is required for FooBox to operate correctly and should always be loaded.
 * @version 2.0.0
 * @copyright Steven Usher & Brad Vincent 2013
 */
(function ($, FooBox) {

	/** @type {Object} - Contains the default option values for the responsive addon. */
	var defaults = {
		/** @type {boolean} - A Boolean indicating whether or not to completely hide the previous/next buttons when on mobile devices. */
		hideNavOnMobile: false,
		/** @type {number} - The Number of milliseconds to wait before triggering the FooBox resize event. The timer is reset if another resize is triggered ensuring only a single event is raised. */
		resizeTimeout: 300,
		/** @type {Object} - An object containing breakpoint specific values. */
		breakpoints: {
			/** @type {number} - The Number used to determine the width for phones. Anything with a width smaller than or equal to this number will be treated as being a phone. */
			phone: 640,
			/** @type {number} - The Number used to determine the width for tablets. Anything with a width smaller than or equal to this number will be treated as being a tablet until the phone breakpoint is reached. */
			tablet: 1024
		},
		/** @type {number} - The time in milliseconds between ios7 & Safari's periodic checks for the address and bookmarks bars. Smaller values give better responsiveness but may reduce performance. */
		iosInterval: 200
	};

	/**
	 * Supplied the breakpoints array this object returns all the information required for responsiveness.
	 * @param {Array} breakpoints - An array of breakpoint key value pairs.
	 * @constructor
	 */
	FooBox.BPInfo = function (breakpoints) {
		var ratio = typeof window.devicePixelRatio !== 'undefined' &&  FooBox.browser.isMobile ? window.devicePixelRatio : 1;
		this.width = (window.innerWidth || document.documentElement.clientWidth || (document.body ? document.body.offsetWidth : 0)) / ratio;
		this.height = (window.innerHeight || document.documentElement.clientHeight || (document.body ? document.body.offsetHeight : 0)) / ratio;
		this.orientation = this.width > this.height ? 'fbx-landscape' : 'fbx-portrait';
		var current = null, breakpoint;
		if ($.isArray(breakpoints)) {
			for (var i = 0; i < breakpoints.length; i++) {
				breakpoint = breakpoints[i];
				if (breakpoint && breakpoint.width && this.width <= breakpoint.width) {
					current = breakpoint;
					break;
				}
			}
		}
		this.breakpoint = current == null ? 'fbx-desktop' : current.name;
	};

	/**
	 * The core logic for the FooBox.Responsive addon.
	 * @param {FooBox.Instance} instance - The parent FooBox instance for this addon.
	 * @constructor
	 */
	FooBox.Responsive = function (instance) {

		/** @type {FooBox.Instance} - The parent FooBox instance for this addon. */
		this.FooBox = instance;
		/** @type {Object} - An object containing parsed option values for this addon. */
		this.breakpoint = {
			/** @type {Array} - An array containing key value pairs using the properties "name" and "width". */
			values: [],
			/** @type {string} - A string containing space separated breakpoint class names. */
			names: ''
		};
		/** @type {Object} - An object containing any timers required by this addon. */
		this.timers = {
			/** @type {FooBox.Timer} - A timer used to create a resize delay. */
			resize: new FooBox.Timer(),
			/** @type {FooBox.Timer} - A timer used to create a period check on ios7's bookmark and address bars visibility. */
			ios: new FooBox.Timer()
		};

		/**
		 * @type {FooBox.Responsive} - Hold a reference to this instance of the object to avoid scoping issues.
		 * @private
		 */
		var _this = this;

		/**
		 * @type {(boolean|null)} - Whether or not the ios7 bookmark and address bar is visible. Null is indeterminate.
		 * This variable prevents excessive firing of resizes so only a single event is fired per change.
		 * @private
		 */
		var _iosBars = null;

		/**
		 * This method is called before the core FooBox plugin is created. This allows addons to bind to all events being raised, including those raised during initialization.
		 * @param {jQuery} element - The jQuery element the parent FooBox instance will be created and raising events on.
		 * @param {Object} options - The options used to initialize the FooBox instance.
		 */
		this.preinit = function (element) {
			_this.handlers.unbind(true);
			element.bind('foobox.initialized foobox.reinitialized', _this.handlers.initialized);
		};

		/**
		 * This method is called when the core FooBox plugin is destroyed. This allows addons to unbind all events and remove any additional DOM elements added outside the modal.
		 */
		this.destroy = function(){
			_this.handlers.unbind(true);
		};

		/** @namespace - Contains all the event handlers used by this addon. */
		this.handlers = {
			/**
			 * This unbinds event handlers used by this addon.
			 * @param {boolean} [all=false] - Whether or not to unbind all handlers or just those used during init and reinit.
			 */
			unbind: function(all){
				all = all || false;
				if (all){
					_this.FooBox.element.unbind('foobox.initialized foobox.reinitialized', _this.handlers.initialized);
				}
				$(window).unbind('resize.foobox', _this.handlers.resize);
				_this.FooBox.element.unbind({
					'foobox.beforeShow': _this.handlers.iosBeforeShow,
					'foobox.close': _this.handlers.iosClose
				});
			},
			/**
			 * Handles the foobox.initialized event binding the various events needed by this addon to function.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			initialized: function () {
				_this.handlers.unbind();
				_this.setup.breakpoints();
				_this.style();
				$(window).bind('resize.foobox', _this.handlers.resize);
				// This is a hack to get around ios7 & Safari's terrible handling of the address and bookmarks bar.
				if (FooBox.browser.iOS && (FooBox.browser.isSafari || FooBox.browser.isChrome)){
					_this.FooBox.element.bind({
						'foobox.beforeShow': _this.handlers.iosBeforeShow,
						'foobox.close': _this.handlers.iosClose
					});
				}
				//var $modal = _this.FooBox.modal.element;
				//if ($modal.hasClass('fbx-ios') && ($modal.hasClass('fbx-safari') || $modal.hasClass('fbx-chrome'))){
				//}
			},
			/**
			 * Handles the standard jQuery resize event.
			 * @param {jQuery.Event} e - A standard jQuery.Event object.
			 */
			resize: function () {
				_this.timers.resize.start(function () {
					_this.style();
					var item = _this.FooBox.items.current();
					if (!_this.FooBox.modal.element.has('fbx-show') || item == null) { return; }
					var size = item.handler.getSize(item);
					_this.FooBox.modal.resize(size);
				}, _this.FooBox.options.resizeTimeout);
			},
			/**
			 * For ios7 & Safari kick off a periodic check so see if the address and bookmarks bar are visible while the modal is open.
			 */
			iosBeforeShow: function(){
				_this.timers.ios.start(_this.handlers.ios, _this.FooBox.options.iosInterval);
			},
			/**
			 * For ios7 & Safari stop the periodic checks for the address and bookmarks bar when the modal is closed.
			 */
			iosClose: function(){
				_this.timers.ios.stop();
			},
			/**
			 * Handles the period check of the window orientation and size to determine if the IOS7 & Safari address and bookmark bars are visible.
			 * If the bars are visible this tricks the browser into correctly redrawing itself and triggers the resize event for FooBox.
			 */
			ios: function(){
				if (!_this.FooBox.modal.element.hasClass('fbx-show')){
					_this.timers.ios.start(_this.handlers.ios, _this.FooBox.options.iosInterval);
					return;
				}

				var o = window.orientation || 0,
					h = window.innerHeight,
					landscape = o == 90 || o == -90,
					open = 0, closed = 0,
					sh = landscape ? screen.availWidth : screen.availHeight;

				if (FooBox.browser.isChrome){
					open = sh - (landscape ? 76 : 56);
					closed = sh - (landscape ? 0 : 20);
				} else if (FooBox.browser.isSafari){
					open = sh - 88;
					closed = sh - (landscape ? 0 : 19);
				}

				if ((_iosBars == null || _iosBars == false) && h <= open){
					_iosBars = true;
					_this.iosRedraw();
				} else if ((_iosBars == null || _iosBars == true) && h >= closed) {
					_iosBars = false;
					_this.iosRedraw();
				}
				_this.timers.ios.start(_this.handlers.ios, _this.FooBox.options.iosInterval);
			}
		};

		/** @namespace - Contains the logic used for initialization and reinitialization. */
		this.setup = {
			/**
			 * Parses the 'breakpoints' option to break it down into more friendly objects to work with.
			 */
			breakpoints: function () {
				_this.breakpoint.values = [];
				_this.breakpoint.names = '';
				// Create an array and a space separated string of names to work with.
				for (var name in _this.FooBox.options.breakpoints) {
					if (_this.FooBox.options.breakpoints.hasOwnProperty(name)) {
						_this.breakpoint.values.push({ 'name': _this.fixName(name), 'width': _this.FooBox.options.breakpoints[name] });
						_this.breakpoint.names += _this.fixName(name) + ' ';
					}
				}
				// Sort it so the smallest breakpoint is checked first
				_this.breakpoint.values.sort(function (a, b) {
					return a.width - b.width;
				});
			}
		};

		/**
		 * This is the core fix of the ios7 redraw issue when the address and bookmark bars appear.
		 * This first line triggers a layout by simply setting the scroll position to itself.
		 * The second line triggers a resize event like pre ios7.
		 */
		this.iosRedraw = function(){
			window.scrollTo(0, document.body.scrollTop);
			$(window).trigger('resize');
		};

		/**
		 * Takes a breakpoint name and generates a CSS class name out of it.
		 * @param {string} name - The breakpoint name to be converted.
		 * @returns {string}
		 */
		this.fixName = function (name) {
			if (!(/^fbx-[a-zA-Z0-9]/).test(name)) { return 'fbx-' + name; }
			return name;
		};

		/**
		 * Takes into account the options and display size and adds or removes CCS classes as required.
		 */
		this.style = function () {
			var info = new FooBox.BPInfo(_this.breakpoint.values),
				modal = _this.FooBox.modal.element;

			modal.removeClass(_this.breakpoint.names)
				.removeClass('fbx-desktop fbx-landscape fbx-portrait')
				.addClass(info.breakpoint)
				.addClass(info.orientation);

			if (_this.FooBox.options.hideNavOnMobile === true) {
				modal.addClass('fbx-no-nav');
			} else {
				modal.removeClass('fbx-no-nav');
			}
		};
	};

	FooBox.Responsive.metaCheck = function(){
		/* The below is performed only once on script load and is designed to append the correct META tags required for mobile viewing. */
		var $meta = $('meta[name=viewport]'), content = $meta.attr('content');
		if ($meta.length > 0 && typeof content == 'string'){
			var parts = content.split(','), width = false, initial_scale = false;
			for (var i = 0; i < parts.length; i++){
				var part = $.trim(parts[i]);
				if (part.substring(0, 5) == 'width'){
					width = true;
				} else if (part.substring(0, 13) == 'initial-scale'){
					initial_scale = true;
				}
			}
			if (width && !initial_scale){
				parts.push('initial-scale=1');
				content = parts.join(',');
				$meta.attr('content', content);
			}
		}
	};

	FooBox.addons.register(FooBox.Responsive, defaults);

	FooBox.Responsive.metaCheck();

})(jQuery, window.FooBox);;/* jslint devel: true, browser: true, unparam: true, debug: false, es5: true, white: false, maxerr: 1000 */
/**!
 * FooBox Slideshow - An addon providing slideshow support for the FooBox plugin
 * @version 2.0.0
 * @copyright Steven Usher & Brad Vincent 2013
 */
(function ($, FooBox) {

	/** @type {Object} - Contains the default option values for the slideshow addon. */
	var defaults = {
		/** @type {Object} - An object containing slideshow related options. */
		slideshow: {
			/** @type {boolean} - A Boolean indicating whether or not to automatically start the slideshow. This will only trigger if there is more than one item in the collection. */
			autostart: false,
			/** @type {boolean} - A Boolean indicating whether or not to automatically stop the slideshow when the last image is displayed. */
			autostop: false,
			/** @type {boolean} - A Boolean indicating whether or not the slideshow feature is enabled. */
			enabled: true,
			/** @type {boolean} - A Boolean indicating whether or not the slideshow only displays image items or all items. */
			imagesOnly: false,
			/** @type {number} - A Number determining the amount of time it takes to hide the play/pause button once the mouse stops moving in fullscreen. */
			mousestopTimeout: 300,
			/** @type {number} - A Number determining the amount of time between switching items in the slideshow. */
			timeout: 6000,
			/** @type {number} - A Number determining the minimum pixels the mouse must move before the play/pause button is shown when in fullscreen mode. */
			sensitivity: 130,
			/** @type {boolean} - A Boolean indicating whether or not to skip over item loading errors and proceed to the next item. */
			skipErrors: false
		}
	};

	/**
	 * The core logic for the FooBox.Slideshow addon.
	 * @param {FooBox.Instance} instance - The parent FooBox instance for this addon.
	 * @constructor
	 */
	FooBox.Slideshow = function (instance) {

		/** @type {FooBox.Instance} - The parent FooBox instance for this addon. */
		this.FooBox = instance;
		/** @type {boolean} - A Boolean indicating whether or not the slideshow is running. */
		this.autostart = false;
		/** @type {boolean} - A Boolean indicating whether or not the slideshow is running. */
		this.running = false;
		/** @type {number} - A Number indicating the percentage the slideshow progress was paused at if it was paused. */
		this.paused = 0;
		/** @type {number} - A Number indicating the amount of milliseconds required to display the remaining percentage of the paused value. */
		this.remaining = 0;
		/** @type {Object} - An object containing any timers required by this addon. */
		this.timers = {
			/** @type {FooBox.Timer} - A timer used to detect when the mouse stops moving. */
			mousestop: new FooBox.Timer()
		};

		/**
		 * @type {FooBox.Slideshow} - Hold a reference to this instance of the object to avoid scoping issues.
		 * @private
		 */
		var _this = this, start = null;

		/**
		 * This method is called before the core FooBox plugin is created. This allows addons to bind to all events being raised, including those raised during initialization.
		 * @param {jQuery} element - The jQuery element the parent FooBox instance will be created and raising events on.
		 * @param {Object} options - The options used to initialize the FooBox instance.
		 */
		this.preinit = function (element, options) {
			_this.handlers.unbind(true);
			_this.autostart = options.slideshow.autostart;
			element.bind({
				'foobox.initialized foobox.reinitialized': _this.handlers.initialized,
				'foobox.setupHtml': _this.handlers.setupHtml,
				'foobox.setupOptions': _this.handlers.setupOptions,
				'foobox.onError': _this.handlers.onError
			});
		};

		/**
		 * This method is called when the core FooBox plugin is destroyed. This allows addons to unbind all events and remove any additional DOM elements added outside the modal.
		 */
		this.destroy = function(){
			_this.handlers.unbind(true);
		};

		/** @namespace - Contains all the event handlers used by this addon. */
		this.handlers = {
			/**
			 * This unbinds event handlers used by this addon.
			 * @param {boolean} [all=false] - Whether or not to unbind all handlers or just those used during init and reinit.
			 */
			unbind: function(all){
				all = all || false;
				if (all){
					_this.FooBox.element.unbind({
						'foobox.initialized foobox.reinitialized': _this.handlers.initialized,
						'foobox.setupHtml': _this.handlers.setupHtml,
						'foobox.setupOptions': _this.handlers.setupOptions,
						'foobox.onError': _this.handlers.onError
					});
				}
				_this.FooBox.element.unbind({
					'foobox.beforeLoad': _this.handlers.beforeLoad,
					'foobox.afterLoad': _this.handlers.afterLoad,
					'foobox.close': _this.handlers.onClose,
					'foobox.previous foobox.next': _this.handlers.onChange,
					'foobox.keydown': _this.handlers.onKeydown,
					'foobox.fullscreenEnabled': _this.handlers.fullscreenEnabled,
					'foobox.fullscreenDisabled': _this.handlers.fullscreenDisabled
				});
				if (_this.FooBox.modal instanceof FooBox.Modal && FooBox.isjQuery(_this.FooBox.modal.element)){
					_this.FooBox.modal.element.undelegate('click.slideshow').unbind('mousemove.foobox')
						.find('.fbx-play, .fbx-pause').unbind('mouseenter.foobox mouseleave.foobox');
				}
			},
			/**
			 * Handles the foobox.initialized event binding the various events needed by this addon to function.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			initialized: function (e) {
				// Clear any pre-existing bindings before we do anything
				_this.handlers.unbind();
				// Only bind if the addon is enabled.
				if (e.fb.options.slideshow.enabled === true && e.fb.instance.items.multiple()) {
					e.fb.instance.element.bind({
						'foobox.beforeLoad': _this.handlers.beforeLoad,
						'foobox.afterLoad': _this.handlers.afterLoad,
						'foobox.close': _this.handlers.onClose,
						'foobox.previous foobox.next': _this.handlers.onChange,
						'foobox.keydown': _this.handlers.onKeydown,
						'foobox.fullscreenEnabled': _this.handlers.fullscreenEnabled,
						'foobox.fullscreenDisabled': _this.handlers.fullscreenDisabled
					});

					e.fb.modal
						.delegate('.fbx-play', 'click.slideshow', _this.handlers.playClicked)
						.delegate('.fbx-pause', 'click.slideshow', _this.handlers.pauseClicked);

					if (e.fb.modal.hasClass('fbx-playpause-center')){
						e.fb.modal
							.bind('mousemove.foobox', _this.handlers.mousemove)
							.find('.fbx-play, .fbx-pause')
							.bind('mouseenter.foobox', _this.handlers.mouseenter)
							.bind('mouseleave.foobox', _this.handlers.mouseleave);
					}
				}
			},
			/**
			 * Handles the foobox.setupHtml event allowing this addon to create any required HTML.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			setupHtml: function (e) {
				if (e.fb.options.slideshow.enabled !== true) { return; }
				e.fb.modal.find('.fbx-inner')
					.append('<div class="fbx-progress"></div>')
					.append('<a href="#playpause" class="fbx-play fbx-btn-transition fbx-btn-shadow"></a>');
			},
			/**
			 * Handles the foobox.setupOptions event allowing this addon to set its initial starting state.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			setupOptions: function (e) {
				if (e.fb.options.slideshow.enabled !== true) { return; }
				e.fb.modal.addClass('fbx-slideshow');
			},
			/**
			 * Handles the foobox.beforeLoad event.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			beforeLoad: function (e) {
				if (e.fb.modal.hasClass('fbx-fullscreen-mode') && e.fb.modal.hasClass('fbx-playpause-center')) {
					start = null;
					_this.timers.mousestop.stop();
				}
			},
			/**
			 * Handles the foobox.afterLoad event.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			afterLoad: function (e) {
				if (e.fb.options.slideshow.autostop == true && e.fb.instance.items.is.last(e.fb.item)) {
					_this.stop(false);
					return;
				}
				if (_this.autostart != true) { return; }
				_this.start();
			},
			/**
			 * Handles the foobox.onError event.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			onError: function (e) {
				if (e.fb.options.slideshow.skipErrors === true && e.fb.instance.modal._first === false) {
					e.preventDefault();
					switch (e.fb.instance.items.indexes.direction) {
						case '<':
							e.fb.instance.modal.prev(e.fb.options.slideshow.imagesOnly === true ? 'image' : null);
							break;
						default:
							e.fb.instance.modal.next(e.fb.options.slideshow.imagesOnly === true ? 'image' : null);
							break;
					}
				} else if (_this.autostart == true) {
					_this.start();
				}
			},
			/**
			 * Handles the foobox.close event.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			onClose: function () {
				_this.stop(false);
			},
			/**
			 * Handles the foobox.prev and foobox.next events.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			onChange: function () {
				_this.stop((_this.autostart == true || _this.running == true));
			},
			/**
			 * Handles the foobox.keydown event.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			onKeydown: function (e) {
				if (e.fb.keyCode == 32){
					if (_this.running == true) _this.pause();
					else _this.start();
				}
			},
			/**
			 * Handles the foobox.fullscreenEnabled event.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			fullscreenEnabled: function (e) {
				if (e.fb.modal.hasClass('fbx-fullscreen-mode') && e.fb.modal.hasClass('fbx-playpause-center')) {
					_this.timers.mousestop.start(function () {
						start = null;
						e.fb.modal.find('.fbx-play, .fbx-pause').fadeOut('fast');
					}, _this.FooBox.options.slideshow.mousestopTimeout);
				}
			},
			/**
			 * Handles the foobox.fullscreenDisabled event.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			fullscreenDisabled: function (e) {
				if (!e.fb.modal.hasClass('fbx-fullscreen-mode') && e.fb.modal.hasClass('fbx-playpause-center')) {
					e.fb.modal.find('.fbx-play, .fbx-pause').removeClass('fbx-active');
					start = null;
					_this.timers.mousestop.stop();
				}
			},
			/**
			 * Handles the standard jQuery click event on the play button.
			 * @param {jQuery.Event} e - A standard jQuery.Event object.
			 */
			playClicked: function (e) {
				e.preventDefault();
				e.stopPropagation();
				_this.start();
			},
			/**
			 * Handles the standard jQuery mouseleave event on the pause button.
			 * @param {jQuery.Event} e - A standard jQuery.Event object.
			 */
			pauseClicked: function (e) {
				e.preventDefault();
				e.stopPropagation();
				_this.pause();
			},
			/**
			 * Handles the standard jQuery mousemove event.
			 * @param {jQuery.Event} e - A standard jQuery.Event object.
			 */
			mousemove: function (e) {
				var s = _this.FooBox.options.slideshow.sensitivity,
					m = _this.FooBox.modal.element;

				if (m.hasClass('fbx-fullscreen-mode') && !m.hasClass('fbx-loading') && !m.hasClass('fbx-error') && !m.hasClass('fbx-playpause-active') && m.hasClass('fbx-playpause-center')) {
					if (start == null) {
						start = {};
						start.X = e.pageX;
						start.Y = e.pageY;
					} else if ((start.X - e.pageX) >= s || (start.Y - e.pageY) >= s || (start.X - e.pageX) <= -s || (start.Y - e.pageY) <= -s) {
						var playpause = m.find('.fbx-play, .fbx-pause');
						if (!playpause.is(':visible')) {
							playpause.fadeIn('fast');
						}
						_this.timers.mousestop.start(function () {
							start = null;
							playpause.fadeOut('fast');
						}, _this.FooBox.options.slideshow.mousestopTimeout);
					}
				}
			},
			/**
			 * Handles the standard jQuery mouseenter event on the play/pause button.
			 * @param {jQuery.Event} e - A standard jQuery.Event object.
			 */
			mouseenter: function () {
				var m = _this.FooBox.modal.element;
				if (m.hasClass('fbx-fullscreen-mode') && !m.hasClass('fbx-error') && m.hasClass('fbx-playpause-center')) {
					m.addClass('fbx-playpause-active');
					start = null;
					_this.timers.mousestop.stop();
				}
			},
			/**
			 * Handles the standard jQuery mouseleave event on the play/pause button.
			 * @param {jQuery.Event} e - A standard jQuery.Event object.
			 */
			mouseleave: function () {
				var m = _this.FooBox.modal.element;
				if (m.hasClass('fbx-fullscreen-mode') && !m.hasClass('fbx-error') && m.hasClass('fbx-playpause-center')) {
					m.removeClass('fbx-playpause-active');
					_this.timers.mousestop.start(function () {
						start = null;
						m.find('.fbx-play, .fbx-pause').fadeOut('fast');
					}, _this.FooBox.options.slideshow.mousestopTimeout);
				}
			}
		};

		/**
		 * Starts the slideshow taking into account the various options as well as the current state.
		 */
		this.start = function () {
			_this.remaining = (_this.remaining < 1) ? _this.FooBox.options.slideshow.timeout : _this.remaining;
			_this.autostart = false;
			_this.running = true;
			_this.FooBox.modal.element.find('.fbx-progress')
				.css('width', _this.paused + '%')
				.show()
				.animate({ 'width': '100%' }, _this.remaining, 'linear', function () {
					_this.paused = 0;
					_this.remaining = _this.FooBox.options.slideshow.timeout;
					_this.autostart = true;
					_this.FooBox.modal.next(_this.FooBox.options.slideshow.imagesOnly === true ? 'image' : null);
				});
			_this.FooBox.modal.element.find('.fbx-play').toggleClass('fbx-play fbx-pause');
			_this.FooBox.raise('foobox.slideshowStart');
		};

		/**
		 * Stops the slideshow taking into account the various options as well as the current state.
		 * @param {boolean} autostart - If set to true the slideshow will start again after the next item is loaded.
		 */
		this.stop = function (autostart) {
			_this.paused = 0;
			_this.FooBox.modal.element.find('.fbx-progress').stop().hide().css('width', '0%');
			_this.running = false;
			_this.autostart = autostart;
			_this.remaining = _this.FooBox.options.slideshow.timeout;
			if (!autostart) {
				_this.FooBox.modal.element.find('.fbx-pause').toggleClass('fbx-play fbx-pause');
			}
			_this.FooBox.raise('foobox.slideshowStop');
		};

		/**
		 * Pauses the slideshow taking into account the various options as well as the current state.
		 */
		this.pause = function () {
			var p = _this.FooBox.modal.element.find('.fbx-progress');
			var pw = p.stop().css('width'), pos = p.css('position');
			var cw = (pos == 'fixed')
				? _this.FooBox.modal.element.css('width')
				: _this.FooBox.modal.element.find('.fbx-inner').css('width');

			_this.running = false;
			_this.paused = (parseInt(pw, 0) / parseInt(cw, 0)) * 100;
			_this.remaining = _this.FooBox.options.slideshow.timeout - (_this.FooBox.options.slideshow.timeout * (_this.paused / 100));
			_this.FooBox.modal.element.find('.fbx-pause').toggleClass('fbx-play fbx-pause');
			_this.FooBox.raise('foobox.slideshowPause');
		};
	};

	FooBox.addons.register(FooBox.Slideshow, defaults);

})(jQuery, window.FooBox);;/* jslint devel: true, browser: true, unparam: true, debug: false, es5: true, white: false, maxerr: 1000 */
/**!
 * FooBox Social - An addon providing social sharing support for the FooBox plugin
 * @version 2.0.0
 * @copyright Steven Usher & Brad Vincent 2013
 */
(function ($, FooBox) {

	/** @type {Object} - Contains the default option values for the caption addon. */
	var defaults = {
		/** @type {Object} - An object containing social related options. */
		social: {
			/** @type {string} - A String used to determine the type of animation to use when showing/hiding the caption. Available animations are 'slide', 'fade' and 'show'. */
			animation: 'fade',
			/** @type {boolean} - A Boolean indicating whether or not the captions feature is enabled. */
			enabled: false,
			/** @type {string} - A String used to determine where to place the social links bar. Available options are 'fbx-top', 'fbx-topleft', 'fbx-topright', 'fbx-bottom', 'fbx-bottomleft' and 'fbx-bottomright'. */
			position: 'fbx-top',
			/** @type {boolean} - A Boolean indicating whether or not to only show the captions when hovering over the FooBox. */
			onlyShowOnHover: false,
			/** @type {boolean} - A Boolean indicating whether or not to only show the captions when clicking the FooBox. */
			onlyShowOnClick: false,			
			/** @type {number} - A Number determining the amount of milliseconds to wait before showing the caption when the onlyShowOnHover option is set to true. If the mouse cursor exits the FooBox before this value the caption will not be shown at all. */
			hoverDelay: 300,
			/** @type {Object} - An Array of global excludes used to override the individual excludes set in each link. */
			excludes: ['iframe', 'html'],
			/** @type {boolean} - A Boolean indicating whether or not to share the original item url or the current page url (including deeplink) */
			original: false,
      /** @type {string} - An extra querystring parameter to add onto the URL that is shared */
      queryString: null,			
			/** @type {Object} - An Array of objects containing the individual link options. */
			links: [
			/*{ css: 'fbx-facebook',  title: 'Facebook', url: 'http://www.facebook.com/sharer.php?s=100&p[url]={url}&p[images][0]={img}&p[title]={title}&p[summary]={desc}' },
				{ css: 'fbx-google-plus',  title: 'Google+', url: 'https://plus.google.com/share?url={url-ne}' },
				{ css: 'fbx-twitter',  title: 'Twitter', url: 'https://twitter.com/share?url={url}&text={title}', titleSource: 'pageTitle', titleCustom: 'Custom Tweet Text!' }, //title|caption|h1|custom
				{ css: 'fbx-pinterest', title: 'Pinterest', url: 'https://pinterest.com/pin/create/bookmarklet/?media={img!}&url={url}&is_video={is_video}&description={title}' },
				{ css: 'fbx-linkedin',  title: 'LinkedIn', url: 'http://www.linkedin.com/shareArticle?url={url}&title={title}' },
				{ css: 'fbx-buffer',  title: 'Buffer', url: '#' },
				{ css: 'fbx-digg',  title: 'digg', url: '#' },
				{ css: 'fbx-reddit',  title: 'Reddit', url: '#' },
				{ css: 'fbx-tumblr',  title: 'Tumblr', url: '#' },
				{ css: 'fbx-stumble-upon',  title: 'StumbleUpon', url: '#' },
				{ css: 'fbx-download', excludes: ['video', 'iframe', 'html'], title: 'Download', url: '{img-ne}' },
				{ css: 'fbx-email', title: 'Email', url: 'mailto:' }*/
			]
		}
	};

	/** @type {boolean} - Whether or not this item allows social icons to be displayed. */
	FooBox.Item.prototype.social = false;

	/**
	 * The core logic for the FooBox.Social addon.
	 * @param {FooBox.Instance} instance - The parent FooBox instance for this addon.
	 * @constructor
	 */
	FooBox.Social = function (instance) {
		/** @type {FooBox.Instance} - The parent FooBox instance for this addon. */
		this.FooBox = instance;
		/** @type {Object} - An object containing any timers required by this addon. */
		this.timers = {
			/** @type {FooBox.Timer} - A timer used to create a hover delay. */
			hover: new FooBox.Timer()
		};

		/**
		 * @type {FooBox.Social} - Hold a reference to this instance of the object to avoid scoping issues.
		 * @private
		 */
		var _this = this;

		/**
		 * @type {HTMLLinkElement} - Create a link to use for url parsing.
		 * @private
		 */
		var _a = document.createElement('a');

		/**
		 * This method is called before the core FooBox plugin is created. This allows addons to bind to all events being raised, including those raised during initialization.
		 * @param {jQuery} element - The jQuery element the parent FooBox instance will be created and raising events on.
		 * @param {Object} options - The options used to initialize the FooBox instance.
		 */
		this.preinit = function (element) {
			_this.handlers.unbind(true);
			element.bind({
				'foobox.initialized foobox.reinitialized': _this.handlers.initialized,
				'foobox.setupHtml': _this.handlers.setupHtml,
				'foobox.setupOptions': _this.handlers.setupOptions,
				'foobox.onError': _this.handlers.onError,
				'foobox.parseItem': _this.handlers.parseItem
			});
		};

		/**
		 * This method is called when the core FooBox plugin is destroyed. This allows addons to unbind all events and remove any additional DOM elements added outside the modal.
		 */
		this.destroy = function(){
			_this.handlers.unbind(true);
		};

		/** @namespace - Contains all the event handlers used by this addon. */
		this.handlers = {
			/**
			 * This unbinds event handlers used by this addon.
			 * @param {boolean} [all=false] - Whether or not to unbind all handlers or just those used during init and reinit.
			 */
			unbind: function(all){
				all = all || false;
				if (all){
					_this.FooBox.element.unbind({
						'foobox.initialized foobox.reinitialized': _this.handlers.initialized,
						'foobox.setupHtml': _this.handlers.setupHtml,
						'foobox.setupOptions': _this.handlers.setupOptions,
						'foobox.onError': _this.handlers.onError,
						'foobox.parseItem': _this.handlers.parseItem
					});
				}
				_this.FooBox.element.unbind({
					'foobox.beforeLoad': _this.handlers.beforeLoad,
					'foobox.afterLoad': _this.handlers.afterLoad,
					'foobox.closeOverlays': _this.handlers.closeOverlays,
					'foobox.afterResize': _this.handlers.afterResize
				});
				if (_this.FooBox.modal instanceof FooBox.Modal && FooBox.isjQuery(_this.FooBox.modal.element)){
					_this.FooBox.modal.element.undelegate('mouseenter.social mouseleave.social')
						.find('.fbx-item-current, .fbx-item-next')
						.unbind('click.social');
				}
			},
			/**
			 * Handles the foobox.initialized event binding the various events needed by this addon to function.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			initialized: function (e) {
				_this.handlers.unbind();
				if (e.fb.options.social.enabled === true) {
					e.fb.instance.element.bind({
						'foobox.beforeLoad': _this.handlers.beforeLoad,
						'foobox.afterLoad': _this.handlers.afterLoad,
						'foobox.closeOverlays': _this.handlers.closeOverlays,
						'foobox.afterResize': _this.handlers.afterResize
					});
					e.fb.modal.find('.fbx-item-current, .fbx-item-next').unbind('click.social').bind('click.social', function(){
							if (!e.fb.modal.hasClass('fbx-phone')){
								_this.handlers.toggleSocial();
							}
						}).end()
						.find('.fbx-social-toggle').unbind('click.social').bind('click.social', function(e){
							e.preventDefault();
							e.stopPropagation();
							_this.handlers.toggleSocial();
						});

					if (e.fb.options.social.onlyShowOnHover === true) {
						e.fb.modal.delegate('.fbx-inner:not(:has(.fbx-item-error))', 'mouseenter.social', _this.handlers.mouseenter)
							.delegate('.fbx-inner:not(:has(.fbx-item-error))', 'mouseleave.social', _this.handlers.mouseleave);
					}
				}
			},
			/**
			 * Handles the foobox.afterResize event.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			afterResize: function(e){
				if (e.fb.modal.hasClass('fbx-phone')){
					_this.handlers.closeOverlays(e)
				} else if (e.fb.options.social.onlyShowOnHover == false && e.fb.options.social.onlyShowOnClick == false) {
					e.fb.modal.removeClass('fbx-social-hidden fbx-social-showing').find('.fbx-social').css('display','');
				}
			},
			/**
			 * Handles the foobox.closeOverlays event.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			closeOverlays: function(e){
				e.fb.modal.removeClass('fbx-social-showing').addClass('fbx-social-hidden');
				_this.hide();
			},
			/**
			 * Handles the standard jQuery click event on the current item to toggle the captions.
			 * @param {jQuery.Event} e - A standard jQuery.Event object.
			 */
			toggleSocial: function () {
				if (_this.FooBox.modal.element.hasClass('fbx-error')) { return; }
				if (_this.FooBox.modal.element.find('.fbx-social').is(':visible')) {
					_this.FooBox.modal.element.removeClass('fbx-social-showing');
					if (_this.hide()){
						_this.FooBox.modal.element.addClass('fbx-social-hidden');
					}
				} else {
					_this.FooBox.modal.element.removeClass('fbx-social-hidden');
					if (_this.show()){
						_this.FooBox.modal.element.addClass('fbx-social-showing');
					}
				}
			},
			/**
			 * Handles the standard jQuery mouseenter event.
			 * @param {jQuery.Event} e - A standard jQuery.Event object.
			 */
			mouseenter: function () {
				var item = _this.FooBox.items.current();
				if (item.element.hasClass('no-social')) return;
				_this.timers.hover.start(function () {
					_this.show();
				}, _this.FooBox.options.social.hoverDelay);
			},
			/**
			 * Handles the standard jQuery mouseleave event.
			 * @param {jQuery.Event} e - A standard jQuery.Event object.
			 */
			mouseleave: function () {
				var item = _this.FooBox.items.current();
				if (item.element.hasClass('no-social')) return;
				_this.timers.hover.start(function () {
					_this.hide();
				}, _this.FooBox.options.social.hoverDelay);
			},
			/**
			 * Handles the foobox.setupHtml event allowing this addon to create any required HTML.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			setupHtml: function (e) {
				if (!e.fb.options.social.enabled) return;
				var $social = $('<div class="fbx-social"></div>');
				for (var i = 0; i < e.fb.options.social.links.length; i++) {
					var link = e.fb.options.social.links[i];
					$social.append('<a href="' + link.url + '" rel="nofollow" target="_blank" class="' + link.css + '" title="' + link.title + '"></a>');
				}
				e.fb.modal.find('.fbx-inner').append($social).append('<a href="#social" class="fbx-social-toggle fbx-btn-transition fbx-btn-shadow"></a>');
			},
			/**
			 * Handles the foobox.setupOptions event allowing this addon to set its initial starting state.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			setupOptions: function (e) {
				if (!e.fb.options.social.enabled) return;
				var display = e.fb.options.social.enabled && !e.fb.options.social.onlyShowOnHover ? '' : 'none';
				e.fb.modal.find('.fbx-social').addClass(e.fb.options.social.position).css('display', display);
				if (e.fb.options.social.enabled == true){ e.fb.modal.addClass('fbx-social-share'); }
				else { e.fb.modal.removeClass('fbx-social-share'); }
			},
			/**
			 * Handles the foobox.beforeLoad event.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			beforeLoad: function (e) {
				if ($(e.fb.item.element).hasClass('no-social')) {
					e.fb.modal.removeClass('fbx-social-share');
					return;
				}
				e.fb.modal.addClass('fbx-social-share');
				if (e.fb.modal.hasClass('fbx-phone')){
					_this.FooBox.modal.element.find('.fbx-social').css('display', 'none');
					return;
				}
				if (e.fb.options.social.onlyShowOnHover == true) { return; }
				_this.FooBox.modal.element.find('.fbx-social').css('display', 'none');
			},
			/**
			 * Handles the foobox.afterLoad event.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			afterLoad: function (e) {
				if ($(e.fb.item.element).hasClass('no-social')) {
					e.fb.modal.removeClass('fbx-social-share');
					return;
				}
				e.fb.modal.addClass('fbx-social-share');
				if (e.fb.modal.hasClass('fbx-phone')) {
					e.fb.modal.find('.fbx-social').css('display', 'none');
				}
				if (e.fb.modal.find('.fbx-item-error').length == 0) {
					for (var i = 0; i < e.fb.options.social.links.length; i++) {
						var link = e.fb.options.social.links[i],
							excludes = $.merge( $.merge( [], e.fb.options.social.excludes || [] ), link.excludes || []),
							$button = e.fb.modal.find('.' + link.css);
						if ($button.length > 0) {
							//show or hide based on the handler excludes
							if ($.inArray(e.fb.item.type, excludes) !== -1) {
								$button.removeAttr('href').hide();
							} else {
								var url = _this.parseUrl(link, e.fb.item);
								if (url != '' && url != '#') {
									url = _this.cleanUrl(url);
									if (link.callback && $.isFunction(link.callback)) {
										url = link.callback.call(this, url);
									}
									if (link.css == 'fbx-download'){
										$button.attr('download', url.replace(/^.*[\\\/]/, ''));
									}
									$button.attr('href', url).show();
								} else {
									$button.removeAttr('href').hide();
								}
							}
						}
					}
				}
				if (e.fb.options.social.onlyShowOnHover == true || e.fb.options.social.onlyShowOnClick == true) { _this.hide(); }
				else { _this.show(); }
			},
			/**
			 * Handles the foobox.parseItem event.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */			
			parseItem: function(e) {
				e.fb.item.share_url = e.fb.item.element.data('url') || null;
			},
			/**
			 * Handles the foobox.onError event.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			onError: function (e) {
				e.fb.modal.find('.fbx-social').css('display', 'none');
			}
		};

		/**
		 * Hides the social links taking into account the various options for animation.
		 */
		this.hide = function () {
			var item = _this.FooBox.items.current(),
				$social = _this.FooBox.modal.element.find('.fbx-social');

			if (!_this.FooBox.options.social.enabled || !item.social || item.element.hasClass('no-social')) {
				$social.css('display', 'none');
				return true;
			}
			switch (_this.FooBox.options.social.animation) {
				case 'fade':
					$social.stop(true, true).fadeOut(500);
					break;
				case 'slide':
					$social.stop(true, true).slideUp(500);
					break;
				default:
					$social.css('display', 'none');
					break;
			}
			return true;
		};

		/**
		 * Shows the social links taking into account the various options for animation.
		 */
		this.show = function () {
			var item = _this.FooBox.items.current(),
				$social = _this.FooBox.modal.element.find('.fbx-social');

			if (!_this.FooBox.options.social.enabled || !item.social || _this.FooBox.modal.element.hasClass('fbx-social-hidden') || (FooBox.isjQuery(item.element) && item.element.hasClass('no-social'))) {
				$social.css('display', 'none');
				return false;
			}

			if (_this.FooBox.modal.element.hasClass('fbx-phone')){
				$social.one('click', _this.hide);
			}

			switch (_this.FooBox.options.social.animation) {
				case 'fade':
					$social.stop(true, true).fadeIn(600);
					break;
				case 'slide':
					$social.stop(true, true).slideDown(400);
					break;
				default: // show
					$social.css('display', '');
					break;
			}
			return true;
		};

		/**
		 * Takes the supplied url and returns the full url.
		 * @param {string} url - The url to make sure is full.
		 */
		this.fullUrl = function(url){
			_a.href = url;
			return _a.href;
		};
		
    this.fixUrl = function(url){
      if (_this.FooBox.options.social.queryString) {
        var hash = '', separator = url.indexOf('?') !== -1 ? '&' : '?';    
        if (url.indexOf('#') !== -1){
          hash = url.replace(/.*#/, '#');
          url = url.replace(/#.*/, '');
        }
        return url + separator + _this.FooBox.options.social.queryString + hash;
      }
      return url;
    };		

		this.parseUrl = function(link, item) {
			var url = link.url,
				current = this.fixUrl(
					item.share_url ? item.share_url :
						_this.FooBox.options.social.original ? _this.fullUrl(item.url) : location.href);
				
			if (current.indexOf('{img}') != -1) {
				current = current.replace(/{img}/g, decodeURIComponent(item.image_url));
			}
				
			if (url.indexOf('{url-ne}') != -1) url = url.replace(/{url-ne}/g, current);
			if (url.indexOf('{url}') != -1) url = url.replace(/{url}/g, encodeURIComponent(current));

			if (url.indexOf('{img!}') != -1) {
				if (item.image_url) {
					url = url.replace(/{img!}/g, encodeURIComponent(item.image_url));
				} else {
					//not a valid image url so return nothing
					return '';
				}
			}

			if (url.indexOf('{img-ne}') != -1) url = url.replace(/{img-ne}/g, item.image_url);
			if (url.indexOf('{img}') != -1) {
				var img = decodeURIComponent(item.image_url);
				url = url.replace(/{img}/g, encodeURIComponent(img));
			}

			if (url.indexOf('{title}') != -1) {
				var title = [item.title];
				if (link.titleSource == 'caption') {
					title = [item.title, item.description];
				} else if (link.titleSource == 'h1') {
					title = [$('h1:first').text()];
				} else if (link.titleSource == 'custom') {
					title = [link.titleCustom];
				} else {
					title = [document.title, item.title];
				}
				title = $.grep(title,function(n){ return(n) });
				title = title.join(' - ');
				title = title.replace(/(<([^>]+)>)/ig, '');
				url = url.replace(/{title}/g, encodeURIComponent(title));
			}

			if (url.indexOf('{desc}') != -1) {
				var desc = item.description || '';
				desc = desc.replace(/(<([^>]+)>)/ig, '');
				url = url.replace(/{desc}/g, encodeURIComponent(desc));
			}

			if (url.indexOf('{is_video}') != -1) {
				var is_video = item.video_valid ? 'true' : 'false';
				url = url.replace(/{is_video}/g, is_video);
			}
			return url;
		};

		this.cleanUrl = function(fullUrl) {
			//firstly, remove any expressions we may have left in the url
			fullUrl = fullUrl.replace(/\{([^{}]*)}/g, '');

			//then remove any empty parameters left in the url
			var params = fullUrl.match(/[^\=\&\?]+=[^\=\&\?]+/g),
				url = fullUrl.split("?")[0];
			if (params && params.length > 0) {
				url += "?" + params.join("&");
			}

			return url;
		};
	};

	FooBox.addons.register(FooBox.Social, defaults);

})(jQuery, window.FooBox);;/* jslint devel: true, browser: true, unparam: true, debug: false, es5: true, white: false, maxerr: 1000 */
/**!
 * FooBox Swipe - An addon providing simple swipe support for the FooBox plugin
 * @version 2.0.0
 * @copyright Steven Usher & Brad Vincent 2013
 */
(function ($, FooBox) {

	/** @type {Object} - Contains the default option values for the swipe addon. */
	var defaults = {
		swipe: {
			/** @type {boolean} - A Boolean indicating whether or not the swipe feature is enabled. */
			enabled: true,
			/** @type {number} - A Number indicating the minimum amount of pixels to travel before detecting a swipe. */
			min: 80
		}
	};

	/**
	 * The core logic for the FooBox.Swipe addon.
	 * @param {FooBox.Instance} instance - The parent FooBox instance for this addon.
	 * @constructor
	 */
	FooBox.Swipe = function (instance) {

		/** @type {FooBox.Instance} - The parent FooBox instance for this addon. */
		this.FooBox = instance;
		/** @type {boolean} - A Boolean indicating whether or not the touchmove event is active. */
		this.isMoving = false;

		/**
		 * @type {FooBox.Swipe} - Hold a reference to this instance of the object to avoid scoping issues.
		 * @private
		 */
		var _this = this;

		/**
		 * @type {number} - Holds the starting page X position for the swipe.
		 * @private
		 */
		var startX;

		/**
		 * This method is called before the core FooBox plugin is created. This allows addons to bind to all events being raised, including those raised during initialization.
		 * @param {jQuery} element - The jQuery element the parent FooBox instance will be created and raising events on.
		 * @param {Object} options - The options used to initialize the FooBox instance.
		 */
		this.preinit = function (element) {
			_this.handlers.unbind(true);
			element.bind('foobox.initialized foobox.reinitialized', _this.handlers.initialized);
		};

		/**
		 * This method is called when the core FooBox plugin is destroyed. This allows addons to unbind all events and remove any additional DOM elements added outside the modal.
		 */
		this.destroy = function(){
			_this.handlers.unbind(true);
		};

		/** @namespace - Contains all the event handlers used by this addon. */
		this.handlers = {
			/**
			 * This unbinds event handlers used by this addon.
			 * @param {boolean} [all=false] - Whether or not to unbind all handlers or just those used during init and reinit.
			 */
			unbind: function(all){
				all = all || false;
				if (all){
					_this.FooBox.element.unbind('foobox.initialized foobox.reinitialized', _this.handlers.initialized);
				}
				if (_this.FooBox.modal instanceof FooBox.Modal && FooBox.isjQuery(_this.FooBox.modal.element)){
					_this.FooBox.modal.element.unbind({
						'touchstart': _this.handlers.onTouchStart,
						'touchmove': _this.handlers.onTouchMove
					});
				}
			},
			/**
			 * Handles the foobox.initialized event binding the various events needed by this addon to function.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			initialized: function (e) {
				_this.handlers.unbind();
				if (e.fb.options.swipe.enabled === true) {
					e.fb.modal.bind('touchstart', _this.handlers.onTouchStart);
				}
			},
			/**
			 * Handles the standard jQuery touchstart event.
			 * @param {jQuery.Event} e - A standard jQuery.Event object.
			 */
			onTouchStart: function (e) {
				var touches = e.originalEvent.touches || e.touches;
				if (touches.length != 1 || !_this.FooBox.items.multiple()) { return; }
				startX = touches[0].pageX;
				_this.isMoving = true;
				_this.FooBox.modal.element.bind('touchmove', _this.handlers.onTouchMove);
			},
			/**
			 * Handles the standard jQuery touchstart event.
			 * @param {jQuery.Event} e - A standard jQuery.Event object.
			 */
			onTouchMove: function (e) {
				e.preventDefault();
				if (!_this.isMoving) { return false; }
				var touches = e.originalEvent.touches || e.touches;
				var x = touches[0].pageX;
				var dx = startX - x;
				if (Math.abs(dx) >= _this.FooBox.options.swipe.min) {
					_this.cancelTouch();
					if (dx > 0) {
						_this.FooBox.raise('foobox.swipeRight');
						_this.FooBox.modal.next();
					} else {
						_this.FooBox.raise('foobox.swipeLeft');
						_this.FooBox.modal.prev();
					}
				}
				return false;
			}
		};

		/**
		 * Cancels the current touch event resetting the swipe property values.
		 */
		this.cancelTouch = function () {
			_this.FooBox.modal.element.unbind('touchmove', _this.handlers.onTouchMove);
			startX = null;
			_this.isMoving = false;
		};
	};

	FooBox.addons.register(FooBox.Swipe, defaults);

})(jQuery, window.FooBox);;/* jslint devel: true, browser: true, unparam: true, debug: false, es5: true, white: false, maxerr: 1000 */
/**!
 * FooBox Wordpress - An addon providing Wordpress support for the FooBox plugin
 * @version 2.0.0
 * @copyright Steven Usher & Brad Vincent 2013
 */
(function ($, FooBox) {

	/** @type {Object} - Contains the default option values for the fullscreen addon. */
	var defaults = {
		/** @type {Object} - An object containing fullscreen related options. */
		wordpress: {
			/** @type {boolean} - A Boolean indicating whether or not the fullscreen feature is enabled. */
			enabled: false
		}
	};

	/**
	 * The core logic for the FooBox.Wordpress addon.
	 * @param {FooBox.Instance} instance - The parent FooBox instance for this addon.
	 * @constructor
	 */
	FooBox.Wordpress = function (instance) {

		/** @type {FooBox.Instance} - The parent FooBox instance for this addon. */
		this.FooBox = instance;

		/**
		 * @type {FooBox.Wordpress} - Hold a reference to this instance of the object to avoid scoping issues.
		 * @private
		 */
		var _this = this;

		/**
		 * This method is called before the core FooBox plugin is created. This allows addons to bind to all events being raised, including those raised during initialization.
		 * @param {jQuery} element - The jQuery element the parent FooBox instance will be created and raising events on.
		 * @param {Object} options - The options used to initialize the FooBox instance.
		 */
		this.preinit = function (element) {
			_this.handlers.unbind(true);
			element.bind('foobox.createCaption', _this.handlers.onCreateCaption);
		};

		/**
		 * This method is called when the core FooBox plugin is destroyed. This allows addons to unbind all events and remove any additional DOM elements added outside the modal.
		 */
		this.destroy = function(){
			_this.handlers.unbind(true);
		};

		/** @namespace - Contains all the event handlers used by this addon. */
		this.handlers = {
			/**
			 * This unbinds event handlers used by this addon.
			 * @param {boolean} [all=false] - Whether or not to unbind all handlers or just those used during init and reinit.
			 */
			unbind: function(all){
				all = all || false;
				if (all){
					_this.FooBox.element.unbind('foobox.createCaption', _this.handlers.onCreateCaption);
				}
			},
			/**
			 * Handles the foobox.createCaption event.
			 * @param {jQuery.Event} e - A jQuery.Event object augmented with additional FooBox properties.
			 */
			onCreateCaption: function (e) {
				var opt = e.fb.options,
					cont = e.fb.instance.element,
					el = e.fb.item.element,
					caption = '', 
					title = e.fb.item.title,
					desc = e.fb.item.description,
					t = el.data('captionTitle'),
					d = el.data('captionDesc');

				if (opt.wordpress.enabled != true) { return; }
				if (cont.hasClass('gallery')) {
					if (opt.captions.overrideTitle === false) {
						title = t
							|| el.parents(".gallery-item:first").find(".wp-caption-text:first").html()
							|| el.parents(".gallery-item:first").find(".gallery-caption:first").html()
							|| title
							|| '';
					}
					if (opt.captions.overrideDesc === false) {
						desc = d
							|| el.find('img').attr('alt')
							|| desc
							|| '';
					}
				} else if (cont.hasClass('wp-caption') || el.hasClass('wp-caption')) {
					if (opt.captions.overrideTitle === false) {
						title = t
							|| el.find('img').attr('title')
							|| el.parents(".wp-caption:first").find(".wp-caption-text:first").html()
							|| title
							|| '';
					}
					if (opt.captions.overrideDesc === false) {
						desc = d
							|| el.find('img').attr('alt')
							|| desc
							|| '';
					}
				} else if (el.parents(".wp-caption:first").length > 0) {
					if (opt.captions.overrideTitle === false) {
						title = t
							|| el.parents(".wp-caption:first").find('img').attr('title')
							|| el.parents(".wp-caption:first").find(".wp-caption-text:first").html()
							|| title
							|| '';
					}
					if (opt.captions.overrideDesc === false) {
						desc = d
							|| el.parents(".wp-caption:first").find('img').attr('alt')
							|| desc
							|| '';
					}
				} else if (cont.hasClass('tiled-gallery')) {
					if (opt.captions.overrideTitle === false) {
						title = t
							|| el.parents(".tiled-gallery-item:first").find(".tiled-gallery-caption").html()
							|| el.find('img').data('image-title')
							|| el.find('img').attr('title')
							|| title
							|| '';
					}
					if (opt.captions.overrideDesc === false) {
						desc = d
							|| $.trim(el.find('img').data('image-description')).replace(/(^<p>)|(<\/p>$)/ig, '') //replace opening and closing P tags that are generated by tiled gallery
							|| desc
							|| '';
					} 
				} else {
					return;
				}

				// ensure working with strings
				title = title + '';
				desc = desc + '';

				title = title || '';
				desc = desc || '';

				var $tmp = $('<div/>'),
					text_title = $tmp.html(title).text(),
					text_desc = $tmp.html(desc).text();

				if ($.trim(title) == $.trim(desc) || text_title == text_desc) desc = null;

				caption = typeof title === 'string' && title.length > 0 ? FooBox.format('<div class="fbx-caption-title">{0}</div>', title) : caption;
				caption = typeof desc === 'string' && desc.length > 0 ? caption + FooBox.format('<div class="fbx-caption-desc">{0}</div>', desc) : caption;

				e.fb.item.title = title;
				e.fb.item.description = desc;
				e.fb.item.caption = caption;
			}
		};
	};

	FooBox.addons.register(FooBox.Wordpress, defaults);

})(jQuery, window.FooBox);