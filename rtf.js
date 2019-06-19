
function download_rich_text_version() 
{

	function clean( s ) { return trim( decode_entities( s ) ); }
	function value_of( s ) { return clean( $(s).text() ); }
	function contents_of( s ) { return $(s).text(); }
	function trim( s ) { 
		if ( ! s ) s = "";
		return s
			.replace(/\s+/g," ")
			.replace(/^\s+/,"")
			.replace(/\s+$/,"")
			.replace(/\\/g,"\\\\")
			.replace(/\{/g,"\\{")
			.replace(/\}/g,"\\}")
			.replace(/-/g,"\\_")
			.replace(/[\x80-\xFF]/g,c=>{ 
				return "\\'" + pad( 2, c.charCodeAt(0).toString(16) ); 
			} )
			.replace(/[\u0100-\uFFFF]/g,c=>{ 
				return "\\uc0\\u" + pad( 4, c.charCodeAt(0).toString(16) ) + "?"; 
			} )
		; 
	}
	function pad( width, s ) { return new Array(width + 1 - s.length).join("0") + s; }
	function decode_entities( html ) {
		let ta = document.createElement( 'textarea' );
		ta.innerHTML = html;
		return ta.value;
	}
	function format( text ) {
		if ( ! text ) text = "";
		let tokens = clean( text )
			.replace( /(\s+<[a-zA-Z][^>]*>)\s+/g, "$1" )
			.replace( /\s+(<\/[^>]*>\s+)/g, "$1" )
			.replace( /<strong>/g, "\\b " )
			.replace( /<\/strong>/g, "\\b0 " )
			.replace( /<em>/g, "\\i " )
			.replace( /<\/em>/g, "\\i0 " )
		    .replace( /<a[^>]*>(.*?)<\/a>/g, "\\cf" + COLOR.blue + "\\ul $1\\ul0\\cf0 " )
			.split( /\s/ );
		let result = [];
		let s = "";
		while ( tokens.length > 0 ) {
			let token = tokens.shift();
			if ( ( s.length + token.length + 1 ) > 80 ) {
				result.push( s );
				s = "";
			}
			s += token + " ";
		}
		if ( s.length > 0 ) result.push( s );
		return result.join( "\n" ) + "\n";
	}

	function Block() {
		let b = new block();
		if ( arguments.length > 0 ) b.add( arguments );
		return b;
	}

	function block () {
		this.contents = [];
	}

	function expand() {
		for ( i = 0 ; i < arguments.length ; i++ ) {
			if ( typeof arguments[i] == "Array" || 
				 typeof arguments[i] == "Arguments" ||
			     ( typeof arguments[i] == "object" && 
				   arguments[i].hasOwnProperty("length") &&
				   arguments[i].hasOwnProperty( arguments[i].length - 1 )
				 ) ) {
				for ( j = 0 ; j < arguments[i].length ; j++ ) {
					this.contents.push( arguments[i][j] );
				}
			} else {
				this.contents.push( arguments[i] );
			}
		}
		return this;
	}

	block.prototype.add = expand;

	block.prototype.toString = function() {
		let s = "{";
		this.contents.forEach( (c,i) => {
			s += c.toString();
		});
		s += "}";
		console.log( s );
		return s;
	};

	function command ( name ) {
		return "\\" + name + " ";
	}


	let COLOR_VALUES = [
		{ "name": "black",   "r":   0, "g":   0, "b":   0 },
		{ "name": "maroon",  "r": 128, "g":   0, "b":   0 },
		{ "name": "green",   "r":   0, "g": 128, "b":   0 },
		{ "name": "olive",   "r": 128, "g": 128, "b":   0 },
		{ "name": "navy",    "r":   0, "g":   0, "b": 128 },
		{ "name": "purple",  "r": 128, "g":   0, "b": 128 },
		{ "name": "teal",    "r":   0, "g": 128, "b": 128 },
		{ "name": "silver",  "r": 192, "g": 192, "b": 192 },
		{ "name": "gray",    "r": 128, "g": 128, "b": 128 },
		{ "name": "red",     "r": 255, "g":   0, "b":   0 },
		{ "name": "lime",    "r":   0, "g": 255, "b":   0 },
		{ "name": "yellow",  "r": 255, "g": 255, "b":   0 },
		{ "name": "blue",    "r":   0, "g":   0, "b": 255 },
		{ "name": "fuchsia", "r": 255, "g":   0, "b": 255 },
		{ "name": "aqua",    "r":   0, "g": 255, "b": 255 },
		{ "name": "white",   "r": 255, "g": 255, "b": 255 }
	];

	let COLOR = {};
	COLOR_VALUES.forEach( (v,i) => {
		COLOR[v.name] = i + 1; // this is so WRONG for colors to be 1-indexed!!!
	});


	function rtf_document () {

		this.version = 1;
		this.code_page = 1252;
		this.fonts = [
			{
				"family": "swiss",
				"name": "Arial"
			}
		];
		this.colors = [...COLOR_VALUES];

		// layout
		this.page_width = 8.5;  // in inches
		this.page_height = 11;

		this.margin_left = 1;
		this.margin_right = 1;
		this.margin_top = 1;
		this.margin_bottom = 1;

		this.contents = [];

	}
	let RTF = {};
	RTF.Document = function() {
		return new rtf_document( ).add( arguments );
	};

	rtf_document.prototype.add = expand;

	rtf_document.prototype.font_table = function() {
		let result = "{" + command( "fonttbl" );
		for ( let i = 0 ; i < this.fonts.length ; i++ ) {
			let f = this.fonts[i];
			result += "{" + command( "f" + i ); 
			if ( f.family ) result += command( "f" + f.family );
			if ( f.name ) result += f.name + ";";
			result += "}";
		}
		result += "}\n";
		return result;
	};

	rtf_document.prototype.color_table = function() {
		let response = "{" + command( "colortbl;" );
		for ( let i = 0 ; i < 16 ; i++ ) {
			let c = this.colors[i];
			response += 
				command( "red"   + c.r ) + 
				command( "green" + c.g ) + 
				command( "blue"  + c.b ) + 
				";";
		}
		response += "}\n";
		return response;
	};

	rtf_document.prototype.page_layout = function() {
		return "" +
			command( "paperw" + (1440 * this.page_width    ) ) +
			command( "paperh" + (1440 * this.page_height   ) ) +
			command( "margl"  + (1440 * this.margin_left   ) ) +
			command( "margr"  + (1440 * this.margin_right  ) ) +
			command( "margt"  + (1440 * this.margin_top    ) ) +
			command( "margb"  + (1440 * this.margin_bottom ) ) + 
			"\n";
	};

	rtf_document.prototype.list_table = function() {
		return "{" +
			"\\*" +
			command( "listtable" ) +
				"{" +
					command( "list" ) +
					command( "listtemplateid1" ) +
					command( "listhybrid" ) +
					"{" +
						command( "listlevel" ) +
						command( "levelnfc23" ) +
						command( "levelnfcn23" ) +
						command( "leveljc0" ) +
						command( "leveljcn0" ) +
						command( "levelfollow0" ) +
						command( "levelstartat1" ) +
						command( "levelspace" + ( 1440 * 0.25 ) ) +
						command( "levelindent" + ( 1440 * 0 ) ) +
						"{\\*" +
							command( "levelmarker" ) +
							"\\{disc\\}" +
						"}" +
						"{" +
							command( "leveltext" ) +
							command( "leveltemplateid1" ) +
							"\\'01\\uc0\\u8226;" +
						"}" +	
						"{" +
							command( "levelnumbers;" ) +
						"}" +
						command( "fi-" + ( 1440 * 0.25 ) ) +
						command( "li" + ( 1440 * 0.5 ) ) +
						command( "lin" + ( 1440 * 0.5 ) ) +
					"}" +
					"{" +
						command( "listname" ) + ";" +
					"}" +
					command( "listid1" ) +
				"}" +
			"}";
	}

	rtf_document.prototype.toString = function() {
		return Block(
			command( "rtf" + this.version ),
			command( "ansi" ),
			command( "ansicpg" + this.code_page ),
			command( "deff0" ), // default to the first font
			"\n",
			this.font_table(),
			this.color_table(),
//			this.list_table(),
			this.page_layout(),

			command( "deflang1033" ),
			command( "plain" ),
			command( "fs" + (2 * 12) ), // 12 pt
			command( "widowctrl" ),
			command( "hyphauto" ),
			command( "ftnbj" ),
			"\n",
			"{" +
			  command( "footer" ) +
			  command( "pard" ) +
			  command( "qr" ) +
			  command( "plain" ) +
			  command( "f0" ) +
			  command( "fs20" ) +
			  command( "i" ) +
			  "Resume - John Michael Arrowwood - {\\b p.\\chpgn}" +
			"}"
		).add( this.contents ).toString();
	};

	function Color( num ) {
		let b = new block();
		b.add( command( "cf" + num ) );
		for ( let i = 1 ; i < arguments.length ; i++ ) {
			b.add( arguments[i] );
		}
		return b;
	}

	function H1() {
		return Block()
			.add( command( "pard" ) )
			.add( command( "keepn" ) )
			.add( command( "li" + ( 1440 * 0 ) ) ) 
			.add( command( "sb" + ( 1440 * (1 * 1.25 * 12/72 ) ) ) ) // spacing before paragraph
			.add( command( "sa" + ( 1440 * (1.25 * 12/72 ) ) ) ) // spacing after paragraph
			.add( command( "f0" ) )              // font face  - default
			.add( command( "cf" + COLOR.navy ) ) // font color - navy
			.add( command( "fs" + ( 2 * 16 ) ) ) // font size  - 16pt
			.add( command( "b" ) )               // bold
			.add( "\n" )
			.add( arguments )
			.add( "\n" )
			.add( command( "par" ) )
		    .toString() + "\n";
	}

	function H2() {
		return Block()
			.add( command( "pard" ) )
			.add( command( "keepn" ) )
			.add( command( "li" + ( 1440 * 0.25 ) ) ) 
			.add( command( "sb" + ( 1440 * (0 * 1.25 * 12/72 ) ) ) ) // spacing before paragraph
			.add( command( "sa" + ( 1440 * (0.5 * 1.25 * 12/72 ) ) ) ) // spacing after paragraph
			.add( command( "f0" ) )              // font face  - default
			.add( command( "cf" + COLOR.black ) ) // font color - navy
			.add( command( "fs" + ( 2 * 14 ) ) ) // font size  - 16pt
			.add( command( "b" ) )               // bold
			.add( "\n" )
			.add( arguments )
			.add( "\n" )
			.add( command( "par" ) )
		    .toString() + "\n";
	}

	function Paragraph() {
		return Block()
			.add( command( "pard" ) )
			.add( command( "sa" + ( 1440 * (1.25 * 12/72 ) ) ) ) // spacing after paragraph
			.add( command( "ql" ) )
			.add( "\n" )
			.add( arguments )
			.add( command( "par" ) )
			.toString() + "\n";
	}

	function List( items, indent, dist_to_bullet, dist_to_text, spacing ) {
		let left_indent = indent + dist_to_bullet + dist_to_text;
		let results = "";
		items.forEach( (s,i) => {
			results +=	"{" +
							command("pard" ) +
							command( "keepn" ) +
							command( "tx" + ( 1440 * (indent + dist_to_bullet ) ) ) +
							command( "tx" + ( 1440 * left_indent ) ) +
							command( "fi-" + ( 1440 * left_indent ) ) +
							command( "li" + ( 1440 * left_indent ) ) +
							command( "lin" + ( 1440 * left_indent ) ) + 
							command( "sa" + ( 1440 * spacing * 12/72 ) ) +
							"\n" +
							command("tab" ) +
							command("uc0" ) +
							command("u8226" ) +
							command("tab" ) +
							"\n" +
							s +
							command( "par" ) +
						"}" +
						"\n";
		});
		return results;
	}

	function Bullet() {
		return command( "bullet" );
	}

	function contact_information() {
		let results = [];
		results.push( "{" );  // start block
		results.push( H1( "Candidate" ) );
		results.push( "{" );
		results.push( command( "pard" ) );
		results.push( command( "li" + ( 1440 * 0.25 ) ) );
		results.push( command( "tx" + ( 1440 * 1 ) ) );

		results.push( "Name" );
		results.push( command( "tab" ) );
		results.push( 
			Block( 
				command( "b" ), 
				command( "fs" + (2 * 14) ),
				format( $('#header .name').text() ) 
			)
		);
		results.push( command( "line" ) );

		results.push( "Position" );
		results.push( command( "tab" ) );
		results.push( format( $('#header .specialty').text() ) );
		results.push( command( "line" ) );

		results.push( "Phone" );
		results.push( command( "tab" ) );
		results.push( format( $('#header .phone').text() ) );
		results.push( command( "line" ) );

		results.push( "Email" );
		results.push( command( "tab" ) );
		results.push( format( $('#header .email').text() ) );
		results.push( command( "line" ) );

		results.push( command( "par" ) );
		results.push( "}" );
		results.push( "}" );  // end block
		return results.join("\n") + "\n";
	}

	function summary() {
		let results = [];
		results.push( "{" );  // start block
		results.push( H1( clean( $('#summary h1').text() ) ) );
	
		$('#summary .wrapper div').each( (i,e) => {
			results.push( Paragraph( 
				command( "li" + ( 1440 * 0.25 ) ),
				format( e.innerHTML ) ) 
			);
		});

		results.push( "}" );  // end block
		return results.join("\n") + "\n";
	}

	function skills() {
		let results = [];
		results.push( "{" );  // start block
		results.push( H1( clean( $('#skills h1').text() ) ) );
		$('#skills .list').each( (i,e) => {
			results.push( H2( clean( $(e).find('h2').text() ) ) );
			let list = [];
			$(e).find('li').each( (j,l) => {
				let bullet = "";
				if ( j > 0 ) {
					bullet = "{" +
						command( "cf" + COLOR.blue ) +
						",} ";
				}
				list.push( bullet + format( l.innerHTML ).replace(/\s*\n$/,"") + "\n" )
			});
			results.push( Paragraph( 
				command( "li" + ( 1440 * 0.5 ) ),
			    command( "sa" + ( 1440 * (0.5 * 1.25 * 12/72 ) ) ),
				list.join("")
			) );
		});
		results.push( "}" );  // end block
		return results.join("") + "\n";
	}

	function expertise() {
		let results = [];
		results.push( "{" );  // start block
		results.push( H1( clean( $('#expertise h1').text() ) ) );
		$('#expertise .list').each( (i,e) => {
			results.push( H2( 
					( i > 0 ? command( "sb" + ( 1440 * (0.5 * 1.25 * 12/72) ) ) : "" ),
					clean( $(e).find('h2').text() ) 
				) 
			);
			let list = $(e).find('li').map( (j,l) => { return format( l.innerHTML ); } ).get();
			results.push( List( list, 0.25, 0.125, 0.125, 0 ) );
		});
		results.push( "}" );  // end block
		results.push( "{\\pard\\tab\\par}" );
		return results.join("\n") + "\n";
	}

	function history() {
		let results = [];
		results.push( H1( clean( $('#history h1').text() ) ) );
		$('#history .position').each( (i,p) => {

			/* Title */
			results.push( "{" );
			results.push( command( "pard" ) );
			results.push( command( "keepn" ) );
			results.push( command( "tqr" ) );
			results.push( command( "tx" + ( 1440 * 6.5 ) ) );
			results.push( command( "li" + ( 1440 * 0.25 ) ) );
			results.push( command( "fs" + ( 2 * 16 ) ) );
			results.push( command( "cf" + COLOR.black ) );
			results.push( command( "b" ) )
			results.push( format( $(p).find('.title').get()[0].innerHTML ).replace(/\n$/,"") );

			/* Dates */
			results.push( command( "tab" ) )
			results.push( command( "fs" + ( 2 * 10 ) ) );
			results.push( command( "cf" + COLOR.gray ) );
			results.push( command( "i" ) );
			results.push( clean( $(p).find('.dates .from').text() ).replace(/ /,"\\~") );
			results.push( "\\~\\_\\~" );
			results.push( clean( $(p).find('.dates .to').text() ).replace(/ /,"\\~") );

			results.push( command( "par" ) );
			results.push( "}" );
			results.push( "\n" );

			/* PARAGRAPH: client */
			results.push( "{" );
			results.push( command( "pard" ) );
			results.push( command( "keepn" ) );
			results.push( command( "li" + ( 1440 * 0.25 ) ) );

			/* Employment Type */

			results.push( "{" );
			results.push( command( "fs" + ( 2 * 10 ) ) );
			results.push( command( "cf" + COLOR.silver ) );
			if ( $(p).find('.client').hasClass('contract') ) {
				results.push( "contractor" );
			} else {
				results.push( "employee" );
			}
			results.push( " at " );
			results.push( "}\n" );

			/* Employer / Client */
			results.push( "{" );
			results.push( command( "fs" + ( 2 * 14 ) ) );
			results.push( command( "cf" + COLOR.navy ) );
			results.push( format( $(p).find('.client').get()[0].innerHTML ).replace(/\n$/,"") );
			results.push( "}\n" );

			/* Location (City) */
			results.push( "{" );
			results.push( command( "fs" + ( 2 * 10 ) ) );
			results.push( command( "cf" + COLOR.gray ) );
			results.push( " in " );
			results.push( format( $(p).find('.location').get()[0].innerHTML ).replace(/\n$/,"") );
			results.push( "}\n" );

			/* END PARAGRAPH */
			results.push( command( "par" ) );
			results.push( "}\n" );

			/* Technologies Used */
			results.push( "{" );
			results.push( command( "pard" ) );
			results.push( command( "keepn" ) );
			results.push( command( "li" + ( 1440 * 0.25 ) ) );
			results.push( command( "sb" + ( 1440 * (0.5 * 1.25 * 12/72 ) ) ) )
			results.push( command( "sa" + ( 1440 * (0.5 * 1.25 * 12/72 ) ) ) )
			results.push( command( "fs" + ( 2 * 10 ) ) );
			results.push( command( "cf" + COLOR.gray ) );
			results.push( format( "Technologies Used: " + $(p).find('.technologies').get()[0].innerHTML ) );
			results.push( command( "par" ) );
			results.push( "}\n" );

			/* Responsibilities */
			results.push( "{" );
			results.push( command( "pard" ) );
			results.push( command( "keepn" ) );
			results.push( command( "li" + ( 1440 * 0.25   ) ) );
			results.push( command( "sa" + ( 1440 * (0.5 * 1.25 * 12/72 ) ) ) )
			results.push( command( "fs" + ( 2 * 12 ) ) );
			results.push( command( "cf" + COLOR.black ) );
			results.push( format( $(p).find('.responsibilities').get()[0].innerHTML ) );
			results.push( command( "par" ) );
			results.push( "}\n" );

			/* Highlights */
			results.push( List( $(p).find('.highlights li').map( (i,l) => { 
				return format( l.innerHTML );
			}).get(), 0.25, 0.125, 0.125, 0.25 ) );

			results.push( "{\\pard\\tab\\par}" );

		});
		return results.join("") + "\n";
	}
	function education() {
		let results = [];
		results.push( "{" );  // start block
		results.push( H1( clean( $('#education h1').text() ) ) );
		
		results.push( 
				$('#education .school').map( (i,s) => {
					let rtf = "{" +
							// Class / Focus
							command( "pard" ) +
							command( "li" + ( 1440 * 0.25 ) ) +
							command( "tqr" ) +
							command( "tx" + ( 1440 * 6.5 ) ) +
							"{" +
								command( "fs" + ( 2 * 12 ) ) +
								command( "cf" + COLOR.navy ) +
								clean( $(s).find('.focus').text() ) +
							"}" + 
							// When
							command( "tab" ) +
							"{" +
								command( "fs" + ( 2 * 10 ) ) +
								command( "cf" + COLOR.gray ) +
								command( "i" ) +
								clean( $(s).find('.when').text() ) +
							"}" + 
							command( "par" ) +
						"}" +
						"{" +
							// School / Institution
							command( "pard" ) +
							command( "sa" + ( 1440 * ( 0.5 * 1.25 * 12/72 ) ) ) +
							command( "li" + ( 1440 * 0.25 ) ) +
							command( "fs" + ( 2 * 10 ) ) +
							command( "cf" + COLOR.gray ) +
							clean( $(s).find('.name').text() ) +
							"\\~\\_\\~" +
							// location
							clean( $(s).find('.location').text() ) +
							command( "par" ) +
						"}";
					let details = $(s).find('ul li');
					if ( details.length > 0 ) {
						rtf += "{" +
								command( "fs" + ( 2 * 10 ) ) +
								command( "cf" + COLOR.black ) +
								List( $(s).find('ul li').map( (j,c) => {
									return clean( $(c).text() );
								}).get(), 0.25, 0.125, 0.125, 0 ) +
							"}" +
							"{\\pard\\tab\\par}";
					}
					return rtf;
				}).get().join("")
		);

		results.push( "}" );  // end block
		return results.join("\n") + "\n";
	}

	let doc = 
		RTF.Document(
			contact_information(),
			summary(),
			skills(),
			expertise(),
			history(),
			education()
		);
	download( 'jma-resume.' + LAST_UPDATE + '.rtf', doc.toString() );

}
