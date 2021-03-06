E2.p = E2.plugins["array_item_to_typed_array_modulator"] = function(core, node)
{
	this.desc = 'Emits an typed array representation of the specified item in the named array member of the supplied object.';
	
	this.input_slots = [
		{ name: 'object', dt: core.datatypes.OBJECT, desc: 'Input object.', def: null },
		{ name: 'member', dt: core.datatypes.TEXT, desc: 'Name of the array to be accessed.', def: null },
		{ name: 'index', dt: core.datatypes.FLOAT, desc: 'Index of the array item to be converted.', def: 0 }
	];
	
	this.output_slots = [
		{ name: 'array', dt: core.datatypes.ARRAY, desc: 'The string representation of the specified array item.' }
	];

	this.state = { datatype: 6 }; // Default float32
};

E2.p.prototype.reset = function()
{
	this.array = new ArrayBuffer(0);
	this.object = null;
	this.member = null;
	this.index = 0;
};

E2.p.prototype.create_ui = function()
{
	var inp = $('<select />', { selectedIndex: 1 });
	
	$('<option />', { value: 0, text: 'Int8' }).appendTo(inp);
	$('<option />', { value: 1, text: 'Uint8' }).appendTo(inp);
	$('<option />', { value: 2, text: 'Int16' }).appendTo(inp);
	$('<option />', { value: 3, text: 'Uint16' }).appendTo(inp);
	$('<option />', { value: 4, text: 'Int32' }).appendTo(inp);
	$('<option />', { value: 5, text: 'Uint32' }).appendTo(inp);
	$('<option />', { value: 6, text: 'Float32' }).appendTo(inp);
	
	inp.change(function(self) { return function() 
	{
		self.state.datatype = parseInt(inp.val());
		self.updated = true;
	}}(this));
	
	return inp;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.object = data;
	else if(slot.index === 1)
		this.member = data;
	else if(slot.index === 2)
	{
		this.index = Math.floor(data);
		this.index = this.index < 0 ? 0 : this.index;
	}
};	

E2.p.prototype.update_state = function()
{
	if(this.object === null || this.member === null)
		return;
	
	if(!this.object.hasOwnProperty(this.member))
	{
		msg('ERROR: Cannot convert unknown member "' + this.member + '".');
		return;
	}
	
	var a = this.object[this.member];
	
	if(Object.prototype.toString.call(a) !== '[object Array]')
	{
		msg('ERROR: Object member "' + this.member + '" is not an array.');
		return;
	}
	
	var d = a.length > 0 ? a[this.index % a.length] : null;
	
	if(d === null || Object.prototype.toString.call(d).toLowerCase() !== '[object array]')
	{
		msg('ERROR: The member "' + this.member + '" is not an array.');
		return;
	}
	
	switch(this.state.datatype)
	{
		case 0: this.array = new Int8Array(d); break;
		case 1: this.array = new Uint8Array(d); break;
		case 2: this.array = new Int16Array(d); break;
		case 3: this.array = new Uint16Array(d); break;
		case 4: this.array = new Int32Array(d); break;
		case 5: this.array = new Uint32Array(d); break;
		case 6: this.array = new Float32Array(d); break;
	}
	
	this.array = this.array.buffer; // Grrr..
	this.array.datatype = this.state.datatype;
	this.array.stride = [1, 1, 2, 2, 4, 4, 4][this.state.datatype];
};

E2.p.prototype.update_output = function(slot)
{
	return this.array;
};

E2.p.prototype.state_changed = function(ui)
{
	if(ui)
		ui.val('' + this.state.datatype);
};
