# -*- ruby -*-

require 'iconv'
require 'json'
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

jsonOpts = JSON::Ext::Generator::State.new({:space => ' '})

cvt = Iconv.new('ISO-8859-1', 'UTF-8')
inf = File.new('jastas.xml', 'r')

outf = File.new('jastas.json', 'w')
outf.puts('[')
outf.puts('null, // no Jasta 0')

i = 1
doc = Document.new inf
doc.elements.each('jastas/jasta') {
    |sq| 

    raise "missing jasta " + i.to_s if sq.attributes['id'].to_i != i

    outf.puts('[ // Jasta ' + i.to_s)

    i += 1

#    outf.print '"', cvt.iconv(sq.attributes['name']), '": '

    sq.elements.each('location') { 
        |loc|
        a = Array.new(3)
        a[0] = '"' + cvt.iconv(loc.attributes['name']) + '"'
        a[1] = canonicalizeDateStr(loc.attributes['fromDate'])
        a[2] = canonicalizeDateStr(loc.attributes['toDate'])
        outf.puts ' [' + a.join(',') + '],'
    }

    outf.puts('],')
}

outf.puts("]")
outf.close
