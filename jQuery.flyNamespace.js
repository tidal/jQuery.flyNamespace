/*
Copyright (c) 2008-2010Timo Michna
Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:
The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
/*
* flyNamespace (jQuery.flyNamespace.js) @package_version@ - Plugin for jQuery
*
* Copyright (c) 2008-2010 Timo Michna
*
* Allows for (dynamicly) creating Namespace(s) on jQuery-Toplevel-Element.
* Creates single Fly-Object per Namespace which gets passed Element-References.
* To store for later use, Namespace-Objects can create a scoped copy of
* themselfs or bypass the Flight-Pattern.
* Every Namespace is configurable in its API and Behavior.
* Namespace-Methods are chainable in Jquery-Style.
* Plugin´s jQuery-Methods are heavily overloaded, to be usefull for different
* requirements and coding-styles.
* Allows for Namespacing existing jQuery-Plugins and the creation of new ones.
*
*/
(function($){
	var jQuery = $;
	//$.fn.self = null;
	var Namespace = function(o, opt){
		// make sure we hav an option object
		opt = opt || {};
		// privat vars
		var
		// caching base object
		obj = o,
		// Html context
		scope,
		// jQuery object
		$scope,
		//namespace
		namespace,
		// value to return by setters
		returnValue,
		// namespace object is observable
		observable = opt.observable !== false,
		// namespace object is extendable
		extendable = opt.extendable && !opt.singleton,
		// namespace object is inheritable
		inheritable = opt.inheritable && !opt.singleton,
		// compile in events for all methods
		methodEvents = observable && !opt.events;
		// creating empty object as base
		// for object augmentation
		var ns = {};
		/*
		// make observable
		if(observable){
			ns.bind = function(evt, callback){
				return jQuery(ns).bind(evt, callback);
			};
			ns.trigger = function(evt, callback){
				return jQuery(ns).trigger(evt);
			};
		}
		if(opt.extend){
			if(typeof opt.extend == 'object'){
				ns = opt.extend.extend(o, opt);
			}else{
				var ext;
				$.each(opt.extend, function(i, e){
					ext = $.extend(ext, e.extend(o, opt));
				});
				return ext;
			}
		}
		 */
		// compile function wrappers
		jQuery.each(o, function(i, p){
			if(typeof p == 'function'){
				ns[i] = (methodEvents || jQuery.inArray(opt.events, i)) ?
					// create observable scoping function wrapper
					function(){
						var v = p.apply(scope, arguments);
						console.info('typeof v ' , typeof v, v, returnValue );
						ns.trigger(i, [ns, arguments, v, returnValue]);
						return typeof v == 'undefined' ? returnValue : v;
					}
				:
				// create scoping function wrapper
				function(){
					var v = p.apply(scope, arguments);
					console.info('typeof v ' , typeof v, v, returnValue );
					return typeof v == 'undefined' ? returnValue : v;
				};
				//ns[i].self = ns;
			}else{
				ns[i] = p;
			}
		});
		// precompile scope method
		var forceCopy = (!opt.singleton && opt.forceCopy);
		var doInit = (typeof opt.init == 'function');
		var doScope = function(el, args){
			scope = el;
			returnValue = ns.context = $scope = $(el);
			if(doInit){ 
				opt.init.apply(el, $.makeArray(args));
			}
			$(el).data('namespace.ns', ns);
			//ns.context = el;
			return ns;
		}
		// extend base object
		ns = jQuery.extend(ns, {
			context: $scope,
			scope: doScope,
			nsStart: function(){
				return returnValue = ns;
			},
			nsEnd: function(){
				return returnValue = $scope;
			},
			copy: function(hardCopy){
				if(opt.singleton){
					return ns;
				}
				var newns = Namespace(obj, opt).scope(scope);
				if(hardCopy || opt.hardCopy){
					jQuery.each(ns, function(k, v){
						if(!newns[k]){
							newns[k] = v;
						}
					});
				}
				return newns;
			},
			data: function(k, v){
				return $(ns).data(k, v);
			},
			extend: function(extObj, extOpt){
				return extendable 
					? Namespace($.extend({}, obj, extObj), $.extend({}, opt, extOpt))
					: new Error('Namespace Object is not extendable');
			},
			inherit: function(extObj, extOpt){
				return inheritable 
					? Namespace($.extend(obj, extObj), $.extend(opt, extOpt))
					: new Error('Namespace Object is not inheritable');
			},
			bind: function(evt, callback){
				jQuery(ns).bind(evt, callback);
			},
			trigger: function(evt, callback){
				jQuery(ns).bind(evt, callback);
			}
		});
		// call setup
		if(typeof opt.setup == 'function'){
			opt.setup.call(ns);
		}
		//return ns;
		return ns;
	}
	var NamespaceManager = {
		activeNamespace: null,
		activeScope: null,
		namespaces: {},
		createNamespace : function(ns, o, options){
			if(!$.data(NamespaceManager, ns)){
				$.data(NamespaceManager, ns, Namespace(o, options));
			}
			var n = $.data(NamespaceManager, ns);
			if(options && options.toplevel){
				$.fn[ns] = function(a1, a2){
					return $(this).ns(ns, a1, a2);
				}
			}
			console.info('NamespaceManager createNamespace ', $.data(NamespaceManager, ns), ns, o, options)
			return n;
		},
		getNamespace : function(ns, args){
			return NamespaceManager.activeNamespace = ns 
				? $.data(NamespaceManager, ns) 
					? $.data(NamespaceManager, ns) 
					: null 
				: NamespaceManager.activeNamespace;
		},
		getScoped : function(ns, scope, args){
			var n = $.data(NamespaceManager, ns);
			console.info('NamespaceManager getScoped ', n, ns, o, options)
			var n = NamespaceManager.getNamespace(ns, args);
			return n ? n.scope(scope, args) : null;
		},
		getActive : function(){
			return NamespaceManager.activeNamespace;
		},
		getLast: function(el){
			return $(el).data('namespace.ns') ||
			NamespaceManager.getActive().scope(el);
		}
	};
	jQuery.ns = function(a1, a2, a3){
		var argNr = arguments.length;
		// return active Namespace
		if(argNr == 0){
			return NamespaceManager.getActive();
		}
		var ns = null;
		var t1 = typeof arguments[0];
		var t2 = typeof arguments[1];
		var t3 = typeof arguments[2];
		// call a namespace by name or object
		if(t1 == 'string' || t1 == 'object'){
			// new namespace creation
			if(t2 == 'object'){
				return r = NamespaceManager.createNamespace(a1, a2, a3);
				console.info('new namespace creation ', r, a1, a2, a3);
				return r;
			}
			ns = t1 == 'string' ? NamespaceManager.getNamespace(a1) : a1;
			//console.info('ns', ns, a1, a2, a3);
			// namespace does not exists
			if(!ns){
				return null;
			}
			// return function calls
			if(t2 == 'string' || t2 == 'function'){
				// concrete namespace method
				if(t2 == 'string'){
					// method does not exist on namespace
					if(!ns[a2]){
						return null;
						// if we have no arguments, we call the method directly
					}else if(!a3){
						return ns[a2]();
					}
					// polymorph argument to be callable
					a2 = ns[a2];
				}
				// return scoped function call
				return a2.apply(ns.scope, a3);
				// return namespace object
			}else{
				//console.info('return ns ', ns);
				// return namespace
				return ns;
			}
		}
		// fallback
		return null;
	}
	jQuery.ns.method = 'ns';
	jQuery.ns.startMethod = 'nsStart';
	jQuery.ns.create = function(name, namespaceObject, options){
		return NamespaceManager.createNamespace(name, namespaceObject, options);
	}
	jQuery.ns.get = NamespaceManager.getNamespace;
	jQuery.ns.build = Namespace;
	jQuery.ns.call = function(context, func, args){
		return func.apply(context, args);
	}
	jQuery.ns.last = function(context, func, args){
		return func.apply(context, args);
	}
	$.fn.ns = function(a1, a2, a3){
		// return active Namespace
		if(!a1){
			//var ns = $(this).data('namespace.ns');
			//console.info('call last Namespace', $(this).data('namespace.ns') ,
			$(this), ns, a1, a2, a3);
			return NamespaceManager.getLast(this);
		}
		var t1 = typeof arguments[0];
		// call a namespace by name
		if(t1 == 'string'){
			var ns = $.ns(a1, a2, a3).scope(this) || $(this);
			//$(this).self = $(this).data('namespace.ns');
			//console.info('call Namespace By Name',$(this).data('namespace.ns') ,
			$(this), ns, a1, a2, a3);
			return ns;
		// call an anonymous function
		}else if (t1 == 'function'){
			var functionArgs = t3 == 'array' ? a3 : [a3];
			return a1.apply(this, functionArgs);
		// creating anonymous namespace
		}else if (t1 == 'object'){
			return Namespace(a1, a2).scope(this, a3);
		}
		// fallback
		return $(this);
	}
	$.fn.nsStart = function(ns){
		var nmspc = $(this).ns(ns);
		if(nmspc){
			return nmspc.nsStart();
		}else{
			return $(this);
		}
	};
})(jQuery);
