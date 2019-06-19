function download_plain_text_version()
{

  function SECTION( name ) { return name.toUpperCase() + "\n\n"; }
  function SUB_SECTION( name ) { return "  " + name.toUpperCase() + "\n"; }
  function BLANK_LINE() { return "\n"; }
  function END_SECTION() { return "\n\n"; }
  function clean( s ) { return trim( decode_entities( s ) ); }
  function value_of ( selector ) { return clean( $(selector).text() ); }
  function contents_of ( selector ) { return $(selector).html(); }


  function decode_entities ( html )
  {
    let ta = document.createElement( 'textarea' );
    ta.innerHTML = html;
    return ta.value;
  }
  function trim ( text ) 
  {
    return text.replace( /^\s+/, "" ).replace( /\s+$/, "" );
  }
  function wrap( text, prefix, indent, width ) {
	text = text.replace( /\s+/g, " " ).replace( /^\s+/, "" );
    let tokens = text.split( /\s+/ );
    let result = [];
    let s = prefix;
    while ( tokens.length > 0 ) {
      let token = tokens.shift();
      if ( token == "---" ) {
        if ( s.length > 0 ) {
          result.push( s );
        }
        result.push( prefix + token );
        s = indent;
      } else {
        if ( ( s.length + token.length + 1 ) > width ) {
          result.push( s );
          s = indent;
        }
        s += token + " ";
      }
    }
    if ( s.length > 0 ) result.push( s );
    return result.join("\n") + "\n";
  }

  function summary_as_plain_text()
  {
    return wrap( 
      contents_of( '#summary .wrapper' )
        .replace( /<\/?strong>/g, "" )
        .replace( /<\/?a\s*[^>]*>/g, "" )
        .replace( /\s*\n\s*/g, " " )
        .replace( /<(?:div|p)>/g, "" )
        .replace( /<\/(?:div|p)>/g, "\n" )
        .replace( /<hr>/g, "---\n" ),
      "  ", // prefix
      "  ", // indent
      75  // max-width
    );
  }

  function skills_as_plain_text()
  {
    let results = [];
    $('#skills .list').each( (i, section) => {
      results.push( SUB_SECTION( trim( decode_entities( $(section).find('h2').text() ) ) ) );
      results.push( 
        wrap( 
          $(section).find('li').map( (i,item) => { 
            return clean( $(item).text() ); 
          } ).get().join(", "),
          "    ", 
          "    ", 
          75 
        )
      );
      results.push( BLANK_LINE() )
    });
    return results.join("");
  }

  function bullets( list, indent )
  {
    return $(list).map( (i,item) => {
      return wrap( clean( $(item).text() ), indent + " * ", indent + "   ", 75 );
    } ).get();
  }

  function expertise_as_plain_text()
  {
    let results = [];
    $('#expertise .list').each( (i, section) => {
      results.push( SUB_SECTION( clean( $(section).find('h2').text() ) ) );
      results.push( BLANK_LINE() );
      results.push( bullets( $(section).find('li'), "  " ).join( "" ) );
      results.push( BLANK_LINE() )
    });
    return results.join("");

  }

  function history_as_plain_text()
  {
    let results = [];
	let indent = "  ";
    $('#history .position').each( (i, section) => {
	  results.push( indent + "From....: " + clean( $(section).find('.dates .from').text() ) );
	  results.push( indent + "To......: " + clean( $(section).find('.dates .to').text() ) );
	  results.push( indent + "Title...: " + clean( $(section).find('.title').text() ) );
	  results.push( indent + "Company.: " + clean( $(section).find('.client').text() ) );
	  results.push( indent + "As......: " + ( $(section).find('.client').hasClass('employee') ? 'Employee' : 'Contractor' ) );
	  results.push( indent + "Location: " + clean( $(section).find('.location').text() ) );
	  results.push( wrap( "Tech....: " + clean( $(section).find('.technologies').text() ), indent, indent + "          ", 75 ) );
	  results.push( wrap( clean( $(section).find('.responsibilities').text() ), indent + indent, indent + indent, 75 ) );
	  results.push( bullets( $(section).find('.highlights li' ), indent + indent ).join("") );
	  results.push("");
    });
    return results.join("\n") + "\n";

  }

  function education_as_plain_text()
  {
    let results = [];
	let indent = "  ";
    $('#education .school').each( (i, section) => {
      results.push( indent + "When....: " + clean( $(section).find('.when').text() ) );
      results.push( indent + "School..: " + clean( $(section).find('.name').text() ) );
      results.push( indent + "Location: " + clean( $(section).find('.location').text() ) );
      results.push( indent + "Study...: " + clean( $(section).find('.focus').text() ) );
	  let b = $(section).find('li');
	  results.push( bullets( b, indent ).join("") );
    });
    return results.join("\n") + "\n";
  }

  function resume_contents () 
  {
    return "" +
      SECTION( "Contact Information" ) +
        "  Name.: " + value_of( '#header .name' ) + "\n" +
        "  Title: " + value_of( '#header .specialty' ) + "\n" +
        "  Phone: " + value_of( '#header .phone' ) + "\n" +
        "  Email: " + value_of( '#header .email' ) + "\n" +
        END_SECTION() + 

      SECTION( "Summary" ) +
        summary_as_plain_text() +
        END_SECTION() +

      SECTION( "Technical Skills" ) +
        skills_as_plain_text() +
        BLANK_LINE() +

      SECTION( "Specializations" ) +
        expertise_as_plain_text() +
        BLANK_LINE() +

	  SECTION( "Work History" ) +
		history_as_plain_text() +

	  SECTION( "Education" ) +
		education_as_plain_text() +
		END_SECTION() +

      "";
  }

  download( 'jma-resume.' + LAST_UPDATE + '.txt', resume_contents() );

}
