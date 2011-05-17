# -*- ruby -*-
#
# Find reference locations within gazetteer.xml

require 'iconv'
require 'rexml/document'

include REXML

cvt = Iconv.new('ISO-8859-1', 'UTF-8')
inf = File.new('gazetteer.xml', 'r')

refPts = {}

doc = Document.new inf
doc.elements.each('gazetteer/location/mapLoc') {
    |loc|
    curRefPt = cvt.iconv(loc.attributes["refPt"])
    refPts[curRefPt] = 0 if !refPts[curRefPt]
    refPts[curRefPt] += 1
}

refPts.keys().sort().each {
    |refPt|
    puts "#{refPt} (#{refPts[refPt]})"
}
