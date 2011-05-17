# -*- ruby -*-

require 'iconv'
require 'rexml/document'

include REXML

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

cvt = Iconv.new('ISO-8859-1', 'UTF-8')
inf = File.new('jastas.xml', 'r')

outf = File.new('jastas.js', 'w')
outf.puts("// Created by jastasxmltojs.rb from jastas.xml on " + `date` + "\n")
outf.puts('var jastas = [')

i = 1
doc = Document.new inf
doc.elements.each('jastas/jasta') {
    |sq| 

    raise "missing jasta " + i.to_s if sq.attributes['id'].to_i != i

    outf.puts("    { nation:'GE', type:'Jasta', n:#{i}, locs: [")

    i += 1

#    outf.print '"', cvt.iconv(sq.attributes['name']), '": '

    sq.elements.each('location') { 
        |loc|
        a = Array.new(3)
        a[0] = '"' + cvt.iconv(loc.attributes['name']) + '"'
        a[1] = canonicalizeDateStr(loc.attributes['fromDate'])
        a[2] = canonicalizeDateStr(loc.attributes['toDate'])
        outf.puts '        [' + a.join(',') + '],'
    }

    outf.puts(']},')
}

outf.puts("]")
outf.close
