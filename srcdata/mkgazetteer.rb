# -*- ruby -*-

require 'rexml/document'

include REXML

inf = File.new('gazetteer.xml', 'r', encoding: 'utf-8')

outf = File.new('gazetteer.js', 'w', encoding: 'utf-8')
outf.puts("// Created by mkgazetteer.rb from gazetteer.xml on " + `date` + "\n")
outf.print("var gazetteer = {")

first = true

doc = Document.new inf
doc.elements.each('gazetteer/location') do |loc|

  outf.puts(first ? "" : ",")
  first = false

  outf.print '"', loc.attributes['name'].encode("ISO8859-1"), '": '

  country = loc.attributes['country']
  if country =~ /Belgium|France|Germany/
    attrs = []

    mapLoc = loc.elements['mapLoc']
    if mapLoc
      attrs.push("loc:[\"#{mapLoc.attributes["refPt"].encode("ISO8859-1")}\"," +
                       "#{mapLoc.attributes['xDist']}," +
                       "#{mapLoc.attributes['yDist']}]")
    else
      attrs.push("loc:null")
    end

    notes = loc.elements['notes']
    if notes and not notes.text.empty?
      txt = notes.text.gsub(/"/, "&quot;")
      attrs.push("notes:\"#{txt.encode("ISO8859-1")}\"")
    end

    attrs.push("id:\"#{loc.attributes['name'].encode("ISO8859-1").gsub(/[^A-Za-z0-9]/, "_")}\"")

    outf.print("{#{attrs.join(",")}}")

  else # Not in Belgium, France, or Germany
    outf.print("\"#{country}\"")
  end
end

outf.puts
outf.puts("}")
outf.close
