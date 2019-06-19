function download( filename, contents ) 
{
	let MIME = filename.match( /\.txt$/ ) ? "text/plain" : "application/x-rtf";
	let url = 'data:'+MIME+';charset=utf-8,' + encodeURIComponent(contents);
	//saveAs( url, filename );
	let link = document.createElement( 'a' );
	link.setAttribute( 'download', filename );
	link.setAttribute( 'href', url );
	link.setAttribute( 'target', '_new' );

	document.body.appendChild( link );
	link.click();
	document.body.removeChild( link );
}

