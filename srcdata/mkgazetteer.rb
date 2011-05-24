# -*- ruby -*-

require 'iconv'
require 'rexml/document'

include REXML

cvt = Iconv.new('ISO-8859-1', 'UTF-8')
inf = File.new('gazetteer.xml', 'r')

outf = File.new('gazetteer.js', 'w')
outf.puts("// Created by mkgazetteer.rb from gazetteer.xml on " + `date` + "\n")
outf.print("var gazetteer = {")

first = 1

doc = Document.new inf
doc.elements.each('gazetteer/location') {
    |loc|

    outf.puts(first ? "" : ",")
    first = false

    outf.print '"', cvt.iconv(loc.attributes['name']), '": '

    country = loc.attributes['country']
    if country =~ /Belgium|France|Germany/
        attrs = []

#        attrs['country'] = country

        mapLoc = loc.elements['mapLoc']
        if mapLoc
            attrs.push("loc:[\"#{cvt.iconv(mapLoc.attributes["refPt"])}\"," +
                              "#{mapLoc.attributes['xDist']}," + 
                              "#{mapLoc.attributes['yDist']}]")
        else
            attrs.push("loc:null")
        end

        notes = loc.elements['notes']
        if notes and not notes.text.empty?
            txt = notes.text.gsub(/"/, "&quot;")
            attrs.push("notes:\"#{cvt.iconv(txt)}\"")
        end

        attrs.push("id:\"#{cvt.iconv(loc.attributes['name']).gsub(/[^A-Za-z0-9]/, "_")}\"")

        outf.print("{#{attrs.join(",")}}")

    else # Not in Belgium, France, or Germany
        outf.print("\"#{country}\"")
    end
}

outf.puts
outf.puts("}")
outf.close
