# -*- ruby -*-
#
# Pretty horrible as an example of Ruby programming, but it's a one-off anyway.
#
# After this, still had to touch up data by hand, because some squadrons have info past 11/11/1918.
# Also, eight squadrons had illegal date data (missing or typos like month "101") which this program patches with its best guess

require 'iconv'
require 'date'

def format_date(d, m, y)
    return "%d/%d/%4d" % [m.to_i, d.to_i, y.to_i]
end

@cvt = Iconv.new('ISO-8859-1', 'UTF-8')   # needed?

debug = 0

uniqueCountries = {}
uniqueServices  = {}
uniqueLocations = {}

inFile = File.new("squadron_location.txt", "r")

# ignore header, label, column headers
inFile.gets
inFile.gets
inFile.gets

nationInfo = {
    'Britain'   => { "abbrev" => "BR" },
    'Australia' => { "abbrev" => "AU" }
}

nationInfo.keys.each do
    |nation|
    curNation = nationInfo[nation]
    f = File.new("squadrons-#{nation.downcase}.xml", "w")
    f.puts "<?xml version='1.0' encoding='iso-8859-1'?>"
    f.puts
    f.puts "<!-- $Id: $ -->"
    f.puts
    f.puts "<squadrons>"
    curNation["file"]   = f
    curNation["cur_sq"] = nil
    curNation["buffer"] = []   # [[year, month, day, location], [year, month, day, location], ...]
end

# buffer rec offsets
YEAR     = 0
MONTH    = 1
DAY      = 2
LOCATION = 3

inFile.each_line do
    |line|
    country, service, sq_num, base, day, month, year, calc, *notes = line.split(/\t/)

    if !nationInfo[country]
        puts "Unknown country #{country}"
        exit -1
    end

    if day.empty?
        day = 15  # put in estimated date
        puts "#{country} #{service} #{sq_num} @#{base} has no day"
    end

    if month == "0"
        month = 10
        puts "#{country} #{service} #{sq_num} @#{base} has month 0"
    end

    if month == "112"
        month = 12
        puts "#{country} #{service} #{sq_num} @#{base} has month 112"
    end

    if month == "101"
        month = 10
        puts "#{country} #{service} #{sq_num} @#{base} has month 101"
    end

    # Convenience var
    curNationInfo = nationInfo[country]

    # Are we switching squadrons?  If so write out the current squadron (if any!)'s locations
    if sq_num != curNationInfo['cur_sq'] or inFile.eof?
        if curNationInfo['cur_sq']
            i = 0
            while i < curNationInfo['buffer'].length - 1
                curRec  = curNationInfo['buffer'][i]
                nextRec = curNationInfo['buffer'][i + 1]
puts("y#{nextRec[YEAR]} m#{nextRec[MONTH]} d#{nextRec[DAY]} \"#{nextRec.inspect}\"") if debug > 0
                end_date = Date.new(nextRec[YEAR], nextRec[MONTH], nextRec[DAY]) - 1
                curNationInfo['file'].puts("        <location name=\"#{curRec[LOCATION]}\"" +
                                           " fromDate='#{format_date(curRec[DAY], curRec[MONTH], curRec[YEAR])}'" +
                                           " toDate='#{format_date(end_date.mday, end_date.mon, end_date.year)}'/>")
                i += 1
            end
            # Assume the last squadron location's end date is 11/11/1918
            curRec = curNationInfo['buffer'][-1]
            curNationInfo['file'].puts("        <location name=\"#{curRec[LOCATION]}\"" +
                                       " fromDate='#{format_date(curRec[DAY], curRec[MONTH], curRec[YEAR])}'" +
                                       " toDate='#{format_date(11, 11, 1918)}'/>")
            
            curNationInfo['file'].puts("    </squadron>") 
        end
        # Start the new squadron
        curNationInfo['file'].puts("    <squadron nation='#{curNationInfo["abbrev"]}' type='#{service}' num='#{sq_num}'>")
        curNationInfo['buffer'] = []
    end

    curNationInfo['cur_sq'] = sq_num
    curNationInfo['buffer'].push([ year.to_i, month.to_i, day.to_i, base ] )
puts "*" + curNationInfo['buffer'].inspect + "*" if debug > 1

    uniqueCountries[country] = 1
    uniqueServices[service]  = 1
    uniqueLocations[base]    = 1
end

inFile.close

nationInfo.keys.each do
    |nation|
    curNation = nationInfo[nation]
    curNation["file"].puts("    </squadron>") if curNation["cur_sq"]
    curNation["file"].puts "</squadrons>"
end

g = File.new("brgazetteer.xml", "w")
g.puts "<?xml version='1.0' encoding='iso-8859-1'?>"
g.puts "<locations>"
uniqueLocations.keys.sort.each do
    |base|
    g.puts "    <location name=\"#{base}\"></location>"
end
g.puts "</locations>"
g.close
