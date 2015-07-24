// Equipments

_tablelist.prototype._equipments_columns = [
	'  ',
	['火力',	'fire'],
	['雷装',	'torpedo'],
	['对空',	'aa'],
	['对潜',	'asw'],
	['爆装',	'bomb'],
	['命中',	'hit'],
	['装甲',	'armor'],
	['回避',	'evasion'],
	['索敌',	'los'],
	['射程',	'range'],
	['可改修','improvable']
]
_tablelist.prototype._equipments_append_item = function( equipment_data, collection_id ){
	var self = this
		,tr = $('<tr class="row" data-equipmentid="'+ equipment_data['id'] +'" data-equipmentcollection="'+ collection_id +'"/>')
				.attr({
					'data-infos': 		'[[EQUIPMENT::'+ equipment_data['id'] +']]',
					'data-equipmentedit':self.dom.container.hasClass('equipmentlist-edit') ? 'true' : null
				})
				.appendTo( this.dom.tbody )

	function _val( val, show_zero ){
		if( !show_zero && (val == 0 || val === '0' || val === '') )
			return '<small class="zero">-</small>'
		//if( val > 0 )
		//	return '+' + val
		return val
	}

	for( var i in self._equipments_columns ){
		switch( self._equipments_columns[i][1] ){
			case ' ':
				$('<th/>').html(equipment_data.getName()).appendTo(tr)
				break;
			case 'range':
				$('<td data-stat="range" data-value="' + equipment_data['stat']['range'] + '"/>')
					.html(
						equipment_data['stat']['range']
							? _g.getStatRange( equipment_data['stat']['range'] )
							: '<small class="zero">-</small>'
					)
					.appendTo(tr)
				break;
			case 'improvable':
				$('<td data-stat="range" data-value="' + (equipment_data['improvable'] ? '1' : '0') + '"/>')
					.html(
						equipment_data['improvable']
							? '✓'
							: '<small class="zero">-</small>'
					)
					.appendTo(tr)
				break;
			default:
				$('<td data-stat="'+self._equipments_columns[i][1]+'" data-value="' + equipment_data['stat'][self._equipments_columns[i][1]] + '"/>')
					.addClass( equipment_data['stat'][self._equipments_columns[i][1]] < 0 ? 'negative' : '' )
					.html( _val( equipment_data['stat'][self._equipments_columns[i][1]] ) )
					.appendTo(tr)
				break;
		}
	}

	return tr
}
_tablelist.prototype._equipments_append_all_items = function(){
	var self = this
	function _do( i, j ){
		if( _g.data.item_id_by_type[i] ){
			if( !j ){
				var data_equipmenttype = _g.data.item_types[ _g.item_type_order[i] ]
				$('<tr class="typetitle" data-equipmentcollection="'+_g.data.item_id_by_type[i]['collection']+'">'
						+ '<th colspan="' + (self._equipments_columns.length + 1) + '">'
							+ '<span style="background-image: url(../app/assets/images/itemicon/'+data_equipmenttype['icon']+'.png)"></span>'
							+ data_equipmenttype['name']['zh_cn']
							+ _frame.app_main.page['equipments'].gen_helper_equipable_on( data_equipmenttype['id'] )
						+ '</th></tr>'
					).appendTo( self.dom.tbody )
			}

			self._equipments_append_item(
				_g.data.items[ _g.data.item_id_by_type[i]['equipments'][j] ],
				_g.data.item_id_by_type[i]['collection']
			)

			setTimeout(function(){
				if( j >= _g.data.item_id_by_type[i]['equipments'].length - 1 ){
					_do( i+1, 0 )
				}else{
					_do( i, j+1 )
				}
			}, 0)
		}else{
			//self.mark_high()
			// force thead redraw
				self.thead_redraw()
			_frame.app_main.loaded('tablelist_'+self._index, true)
		}
	}
	_do( 0, 0 )
}
_tablelist.prototype._equipments_init = function(){
	var self = this

	// 标记全局载入状态
		_frame.app_main.loading.push('tablelist_'+this._index)
		_frame.app_main.is_loaded = false

	// 生成过滤器与选项
		this.dom.filter_container = $('<div class="options"/>').appendTo( this.dom.container )
		this.dom.filters = $('<div class="filters"/>').appendTo( this.dom.filter_container )

	// 装备大类切换
		var checked = false
		for(var i in _g.data.item_type_collections){
			var radio_id = '_input_g' + parseInt(_g.inputIndex)
			$('<input type="radio" name="equipmentcollection" id="'+radio_id+'" value="'+i+'"/>')
				.prop('checked', !checked )
				.on('change', function(){
					// force thead redraw
					self.thead_redraw()
				})
				.prependTo( this.dom.container )
			$('<label class="tab container" for="'+radio_id+'" data-equipmentcollection="'+i+'"/>')
				.html(
					'<i></i>'
					+ '<span>' + _g.data.item_type_collections[i]['name']['zh_cn'].replace(/\&/g, '<br/>') + '</span>'
				)
				.appendTo( self.dom.filters )
			checked = true
			_g.inputIndex++
		}

	// 生成表格框架
		this.dom.table_container = $('<div class="fixed-table-container"/>').appendTo( this.dom.container )
		this.dom.table_container_inner = $('<div class="fixed-table-container-inner"/>').appendTo( this.dom.table_container )
		this.dom.table = $('<table class="equipments hashover hashover-column"/>').appendTo( this.dom.table_container_inner )
		function gen_thead(arr){
			self.dom.thead = $('<thead/>')
			var tr = $('<tr/>').appendTo(self.dom.thead)
			for(var i in arr){
				if( typeof arr[i] == 'object' ){
					$('<td data-stat="' + arr[i][1] + '"/>')
						.html('<div class="th-inner-wrapper"><span><span>'+arr[i][0]+'</span></span></div>').appendTo(tr)
				}else{
					$('<th/>').html('<div class="th-inner-wrapper"><span><span>'+arr[i][0]+'</span></span></div>').appendTo(tr)
				}
			}
			return self.dom.thead
		}
		gen_thead( self._equipments_columns ).appendTo( this.dom.table )
		this.dom.tbody = $('<tbody/>').appendTo( this.dom.table )

	// 生成装备数据DOM
		self._equipments_append_all_items()

	// 生成底部内容框架
		this.dom.msg_container = $('<div class="msgs"/>').appendTo( this.dom.container )
		if( !_config.get( 'hide-equipmentsinfos' ) )
			this.dom.msg_container.attr( 'data-msgs', 'equipmentsinfos' )

	// 生成部分底部内容
		var equipmentsinfos = $('<div class="equipmentsinfos"/>').html('点击装备查询初装舰娘等信息').appendTo( this.dom.msg_container )
			$('<button/>').html('&times;').on('click', function(){
				self.dom.msg_container.removeAttr('data-msgs')
				_config.set( 'hide-equipmentsinfos', true )
			}).appendTo( equipmentsinfos )
}