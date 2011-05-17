# -*- ruby -*-
#
# Goals: 
# * Show aerodromes in Gazetteer that are never referenced
# * Show aerodromes in unit airfields that have no gazetteer entry

require 'iconv'
require 'rexml/document'

include REXML

ignoredCountries = { "Austria" => 1, "Britain" => 1, "Italy" => 1, "Turkey" => 1, "Macedonia" => 1 }
@aerodromes = {}
@notInGazetteer = {}
inIgnoredCountry = {}  # contains aerodromes in ignored countries, shouldn't be reported as errors

if ARGV.length == 0
    puts "usage: ruby reconcile.rb squadronfile1.xml [...]"
    exit
end

cvt = Iconv.new("ISO-8859-1", "UTF-8")

# Find all locations in gazetteer
inf = File.new("gazetteer.xml", "r")
gDoc = Document.new inf
gDoc.elements.each("gazetteer/location") {
    |loc|
    mapLocArray = loc.get_elements("mapLoc")  # Find out whether we know about this place
    if mapLocArray.length > 0
        @aerodromes[cvt.iconv(loc.attributes["name"])] = [];
    else
        # Might be outside the western front, though, in which it's not an error
        if ignoredCountries[loc.attributes['country']]
            inIgnoredCountry[loc.attributes["name"]] = 1
        else
            puts "Unknown location for aerodrome #{cvt.iconv(loc.attributes["name"])}"
        end
    end
}

# Find locations referenced by squadrons
ARGV.each {
    |arg|
    inf = File.new(arg, "r")
    sDoc = Document.new inf
    sDoc.elements.each("squadrons/squadron") {
        |sq|
        curUnit = [ sq.attributes["nation"], sq.attributes["type"], sq.attributes["num"] ]
        sq.elements.each("location") {
            |loc|
            loc = cvt.iconv(loc.attributes["name"])
            if @aerodromes[loc] 
                @aerodromes[loc].push(curUnit)
            else
                @notInGazetteer[loc] = [] if !@notInGazetteer[loc]
                @notInGazetteer[loc].push(curUnit)
            end
        }
    }
}

# Now find dangling references
@aerodromes.keys().sort().each {
    |loc|
    puts "In gazetteer but no units: #{loc}" if @aerodromes[loc].length == 0
}

@notInGazetteer.keys.sort().each {
    |loc|
    puts "In units but not in gazetteer: #{loc} #{@notInGazetteer[loc].inspect}" unless inIgnoredCountry[loc]
}

#inIgnoredCountry.keys.each { |loc| puts "#{loc} is in ignored country" }
