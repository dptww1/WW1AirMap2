# -*- ruby -*-

require 'iconv'
require 'rexml/document'

include REXML

@cvt = Iconv.new('ISO-8859-1', 'UTF-8')
@first = true

def canonicalizeDateStr(s)
    if s =~ %r[^           # beginning of string
               (\d{1,2})   # one or two digit month
               \/          # /
               (\d{1,2})   # one or two digit day
               \/          # /
               (\d{4})     # four digit year
              $]x          # end of string
        return "%4s%02d%02d" % [$3, $1, $2]
    end

    return s
end

def processFile(outf, infname)
    inf = File.new(infname, "r")
    doc = Document.new inf
    doc.elements.each('squadrons/squadron') do |sq| 
        nation = sq.attributes['nation']
        type   = sq.attributes['type']
        n      = sq.attributes['num']

        outf.puts(@first ? "" : ",")
        @first = false

        outf.puts("  { nation:'#{nation}', type:'#{type}', n:'#{n}', locs: [")

#    outf.print '"', @cvt.iconv(sq.attributes['name']), '": '

        loc_array = []
        sq.elements.each('location') do |loc|
            a = []
            a.push('"' + @cvt.iconv(loc.attributes['name']) + '"')
            a.push(canonicalizeDateStr(loc.attributes['fromDate']))
            a.push(canonicalizeDateStr(loc.attributes['toDate']))
            loc_array.push("   [#{a.join(',')}]")
        end
        outf.puts("  #{loc_array.join(",\n  ")}")
        outf.print('    ]}')
    end

    inf.close
end

if ARGV.length == 0
    puts "usage: ruby mksquadrons.rb squadronFile1.xml [...]"
    exit -1
end

outf = File.new('squadrons.js', 'w')
outf.puts("// Created by mksquadrons.rb from\n//    #{ARGV.sort.join("\n//    ")}\n// on " + `date` + "\n")
outf.print("var squadrons = [")

ARGV.each { |filename| processFile(outf, filename) }

outf.puts
outf.puts("];")
outf.close
