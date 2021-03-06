/* global global */
/* global nw */
/* global vsprintf */
/* global dev_output_form */
/* global Lockr */
/* global LZString */
/* global Nedb */

"use strict";

// Global Variables
	_g.animate_duration_delay = 320;
	_g.inputIndex = 0;
	_g.lang = 'zh_cn';
	_g.joint = '・';
	_g.defaultHqLv = 90;
	_g.shipMaxLv = 155; // Ship.lvlMax
	
	// check wheather connect online
		//_g.isOnline = false
	
	// check for NW.js app
		_g.isNWjs = (typeof node != 'undefined' || typeof nw != 'undefined');
	
	// Web App for Android/iOS
		_g.isWebApp = (navigator.standalone || _g.uriSearch('utm_source') == 'web_app_manifest');
	
	// check for Windows Universal App
		_g.isUWP = (typeof Windows !== 'undefined' &&
				typeof Windows.UI !== 'undefined' &&
				typeof Windows.UI.Notifications !== 'undefined')
	
	// check for client/app enviroment, eg. NW.js, Native Web App, Universal Windows App
		_g.isClient = (_g.isNWjs || _g.isWebApp || _g.isUWP);
	
	function eventName(event, name){
		name = name ? ('.' + name) : ''
		if( _g.event[event] )
			return _g.event[event].split(' ').map(function(value){
				return value + name
			}).join(' ')
		return event + name
	}

	_g.updateDefaultHqLv = function(val){
		val = parseInt(val) || _g.defaultHqLv
		if( val <= 0 )
			val = _g.defaultHqLv
		if( val != Lockr.get('hqLvDefault', _g.defaultHqLv) ){
			Lockr.set('hqLvDefault', val)
			clearTimeout(_g.delay_updateDefaultHqLv)
			_g.delay_updateDefaultHqLv = setTimeout(function(){
				$body.trigger('update_defaultHqLv', [val])
				clearTimeout(_g.delay_updateDefaultHqLv)
				_g.delay_updateDefaultHqLv = null
			}, 200)
		}
	};

	_g.statSpeed = {
		5: 	'低速',
		10: '高速'
	};
	_g.statRange = {
		1: 	'短',
		2: 	'中',
		3: 	'长',
		4: 	'超长'
	};
	_g.textRank = {
		1:	'|',
		2:	'||',
		3:	'|||',
		4:	'\\',
		5:	'\\\\',
		6:	'\\\\\\',
		7:	'》'
	};
	_g.getStatSpeed = function( speed ){
		return _g.statSpeed[parseInt(speed)]
	};
	_g.getStatRange = function( range ){
		return _g.statRange[parseInt(range)]
	};
	
	_g.getSize = function( bytes, target ){
		target = target.toUpperCase()
		
		if( target[target.length-1] == 'B' )
			target = target.substr(0, target.length-1)
		
		function _r(r){
			return Math.floor( r * 100 ) / 100
		}

		bytes = bytes / 1024;
		if( target == 'K' ) return _r(bytes) + 'KB';
		bytes = bytes / 1024;
		if( target == 'M' ) return _r(bytes) + 'MB';
		bytes = bytes / 1024;
		if( target == 'G' ) return _r(bytes) + 'GB';
		bytes = bytes / 1024;
		if( target == 'T' ) return _r(bytes) + 'TB';
	};



// locale object
	var _l = {};



// String
	String.prototype.printf = function() {
		if( typeof vsprintf != 'undefined' )
			return vsprintf(this, Array.prototype.slice.call(arguments));
		return this;
	};



// main badge
	_g.badge = function( cont, t ){
		if( typeof t == 'string' )
			t = t.toLowerCase()
		switch(t){
			case 'error':
				return _g.badgeError(cont)
				break;
			default:
				return _g.badgeMsg(cont)
				break;
		}
	};
	_g.badgeMsg = function( cont ){
		_frame.dom.layout.attr('data-msgbadge', cont)
		clearTimeout( this.timeout_badgeMsg_hiding )
		this.timeout_badgeMsg_hiding = setTimeout(function(){
			_frame.dom.layout.removeAttr('data-msgbadge')
			delete _g.timeout_badgeMsg_hiding
		}, 3000)
	};
	_g.badgeError = function( cont ){
		_frame.dom.layout.attr('data-errorbadge', cont)
		clearTimeout( this.timeout_badgeError_hiding )
		this.timeout_badgeError_hiding = setTimeout(function(){
			_frame.dom.layout.removeAttr('data-errorbadge')
			delete _g.timeout_badgeError_hiding
		}, 3000)
	};



// main
	_g.pageChangeBefore = function(){
		_frame.dom.mobilemenu.prop('checked', false)
		_frame.modal.hide()
	}
	_g.title = function(t){
		if( !t ){
			let f = document.title.split(' - ')
			if( f.length == 1 )
				return f[0]
			f.pop()
			return f.join(' - ')
		}
		if( _frame.dom.title )
			_frame.dom.title.text(t === true ? '是谁呼叫舰队' : t)
		return t
	}



// search index
	_g.index = {
		ships: {},
		equipments: {}
	};
	_g.buildIndex = function(){
		function _build( datalist, n ){
			for(let i in datalist){
				let ids = (n == 'ships')
						? datalist[i].getSeriesData().map(function(o){
									return o.id
								})
						: [datalist[i].id]
				if( ids.push && ids.length == 0 )
					ids = [datalist[i].id]
				for(let j in datalist[i].name){
					if( datalist[i].name[j] && j != 'suffix' ){
						let _n = datalist[i].name[j].toLowerCase()
						if( !_g.index[n][_n] )
							_g.index[n][_n] = []
						ids.forEach(function(thisId){
							if( !_g.index[n][_n].some(function(thisObj){
								return thisObj.id == thisId
							}) ){
								_g.index[n][_n].push( datalist[thisId] )
							}
						})
					}
				}
			}
		}
		_build( _g.data.ships, 'ships' )
		_build( _g.data.items, 'equipments' )
	};
	_g.search = function( q, t ){
		t = _g.index[t]
		let r = [], e = []
		if( !t || !q )
			return r
		q = q.trim().toLowerCase()
		function _concat(a){
			r = r.concat(
				a.filter(function(v){
					if( e.indexOf( t + v.id ) > -1 )
						return false
					e.push( t + v.id )
					return true
					//return (r.indexOf(v) < 0)
				})
				/*
				.sort(function(a,b){
					//return (a._name || a.name[_g.lang]) - (b._name || b.name[_g.lang])
					return (b.name.suffix||0) - (a.name.suffix||0)
				})
				*/
			)
		}
		if( t[q] )
			_concat(t[q])
		for( let i in t ){
			if( q !== i && i.indexOf(q) > -1 ){
				_concat(t[i])
			}
		}
		return r
	};
	_g.searchTest = function( q, t ){
		let r = []
		q = _g.search( q, t )
		for( let i in q ){
			r.push(q[i]._name || q[i].name[_g.lang])
		}
		return r
	};
