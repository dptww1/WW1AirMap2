# -*- ruby -*-

require 'iconv'
require 'json'
require 'rexml/document'

include REXML

jsonOpts = JSON::Ext::Generator::State.new({:space => ' '})

cvt = Iconv.new('ISO-8859-1', 'UTF-8')
inf = File.new('gazetteer.xml', 'r')

outf = File.new('gazetteer.json', 'w')

outf.puts('{')

doc = Document.new inf
doc.elements.each('gazetteer/location') {
    |loc|

    outf.print '"', cvt.iconv(loc.attributes['name']), '": '

    country = loc.attributes['country']
    if country =~ /Belgium|France|Germany/
        attrs = Hash.new(nil)

        attrs['country'] = country

        mapLoc = loc.elements['mapLoc']
        if mapLoc
            attrs['mapLoc'] = { :refPt => mapLoc.attributes['refPt'], 
                                :xDist => mapLoc.attributes['xDist'],
                                :yDist => mapLoc.attributes['yDist'] }
        end

        notes = loc.elements['notes']
        if notes
            attrs['notes'] = notes.text
        end

        outf.print(JSON.generate(attrs, jsonOpts))

    else
        outf.print(JSON.generate(country))
    end

    outf.puts(',')
}

outf.puts("}")
outf.close
