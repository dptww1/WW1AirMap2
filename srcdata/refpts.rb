# -*- ruby -*-
#
# Find reference locations within gazetteer.xml

require 'rexml/document'

include REXML

inf = File.new('gazetteer.xml', 'r')

refPts = {}

doc = Document.new inf
doc.elements.each('gazetteer/location/mapLoc') do |loc|
    curRefPt = loc.attributes["refPt"].encode!("UTF-8")
    refPts[curRefPt] = 0 if !refPts[curRefPt]
    refPts[curRefPt] += 1
end

refPts.keys().sort().each { |refPt| puts "#{refPt} (#{refPts[refPt]})" }
