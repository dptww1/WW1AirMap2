require 'date'
require 'rexml/document'

include REXML

@debug = 0

@aerodromes = {}
startDates = {} # collection of unique dates where at least one squadron changed location
endDates   = {} # collection of uniques dates where squadron ended at location

#========================================================================
# candidate: "YYYYMMDD"
# arrayList: array of [startDate, endDate, unitList] entries
def findInsertionPt(candidate, arrayList)
  idx = 0
  arrayList.each do |rec|
    return idx if rec[0] >= candidate || rec[1] >= candidate
    idx += 1
  end
end

#========================================================================
def makeCmpDate(d)
  year, month, day = d.unpack("A4A2A2")

  # Computers hate dates before 1970. Turns out that 1916 has the same "shape" as 1972, so let's play pretend
  year = year.to_i - 1916 + 1972
  begin
    return Date.new(year, month.to_i, day.to_i)
  rescue
    puts "Date.new threw an exception for #{year}/#{month}/#{day}"
    exit 0
  end
end

#========================================================================
def decrDate(d)
  d = makeCmpDate(d)
  d -= 1
  return "%04d%02d%02d" % [ d.year - 1972 + 1916, d.month, d.day ]
end

#========================================================================
def incrDate(d)
  d = makeCmpDate(d)
  d += 1
  return "%04d%02d%02d" % [ d.year - 1972 + 1916, d.month, d.day ]
end

#========================================================================
def addRecordData(loc, unitRec, from, to)
  # Some aerodromes in the squadron lists aren't in the gazetteer, so they won't yet be in @aerodromes yet. Fix that.
  @aerodromes[loc] = { 'dates' => [] } unless @aerodromes[loc]

  a = @aerodromes[loc]["dates"]

  puts "'#{loc}' '#{unitRec}' '#{from}' '#{to}'" if @debug > 1

  # Trivial case: inserting into empty record list?
  if a.length == 0
    a.push([ from, to, [ unitRec ] ])
    puts "Initialized #{loc} with [#{from}, #{to}, " + unitRec.inspect + " ]" if @debug > 1
    return
  end

  puts "*** #{loc} is currently: #{a.inspect}" if @debug > 1

  # Trivial case: new record's end date is before first start date in list
  if (to < a[0][0])
    a.unshift([ from, to, [ unitRec ] ])
    puts "Trivially added to beginning" if @debug > 1
    return
  end

  # Trivial case: new record's start date is after last end date in list
  if (from > a[-1][1])
    a.push([ from, to, [ unitRec ] ])
    puts "Trivially added to end" if @debug > 1
    return
  end

  # OK, there's some date overlapping. Find the insertion point for the new
  # record's start date. This will be the earliest record with either a start
  # or end date >= new start date
  s = findInsertionPt(from, a)

  puts "  s = #{s}" if @debug > 1

  # If the start date is not equal to the start date at the insertion point,
  # then we need to construct a new record accounting for the period between
  # the insertion point's starting date and the new record's starting date.
  if from > a[s][0]
    # TODO: Can't assume decrDate(from) in the new node; must use 'to' if it's earlier. See
    # Rumbeke when adding the [19180302, 19180314, [7]] record
    a[s, 0] = [ [ a[s][0], [to, decrDate(from)].min, a[s][2].clone ] ]   # need double [[]] to make sure array gets inserted
    s += 1
    puts "  s bumped to #{s}" if @debug > 1
    # Now patch insertion point's start date
    a[s][0] = from
    if @debug > 1
      puts "Spliced in new record based on > start date; #{a.length} recs now"
      puts a.inspect
    end

  elsif from < a[s][0] then
    a[s, 0] = [ [ from, [to, decrDate(a[s][0])].min, [] ] ]  # need double [[]] to make sure array gets inserted

    if @debug > 1
      puts "Spliced in new record based on < start date; #{a.length} recs now"
      puts a.inspect
    end
  end

  # Now find range containing end date
  e = s;
  while e < a.length
    break if a[e][0] >= to || a[e][1] >= to
    e += 1
  end

  puts "  e is #{e}" if @debug > 1

  # Need to handle running off the end of the list as a special case
  if e > a.length - 1
    a.push([ incrDate(a[-1][1]), to, [] ])
  # Leave e as is -- it's now the index of the last record

  elsif to < a[e][0] # Likewise if to < insertion point's start value
    a[e, 0] = [ [ incrDate(a[e - 1][1]), to, [] ] ]  # need double [[]] to make sure array gets inserted
    # Leave e as is -- it's now the index of the record that we just added

  elsif to != a[e][1] # Otherwise we need to split the end segment
    a[e, 0] = [ [ to.to_i - a[e][0].to_i > 0 ? a[e][0] : to, to, a[e][2].clone ] ] # need double [[]] to make sure array gets inserted
    a[e + 1][0] = incrDate(to)
  end
  # else 'to' is exactly equal to end time of insertion point, so there's nothing to do

  puts "  e is finally #{e}" if @debug > 1

  if @debug > 1
    puts "now before adding unitrec (#{a.length}) recs)"
    puts a.inspect
  end

  # Now, all records between s and e have to have this unitRec added to them.
  # Might have to fill in gaps, too!
  i = s;
  while i <= e                 # can't use "for i in s..e" because e might change!
    if i < e and a[i][1] != decrDate(a[i + 1][0])
      a[i + 1, 0] = [ [ incrDate(a[i][1]), decrDate(a[i + 1][0]), [] ] ]  # need [[]] so array gets inserted
      e += 1
    end
    a[i][2].push(unitRec)
    puts "added #{unitRec} to position #{i}" if @debug > 1
    i += 1
  end

  if @debug > 0
    puts "final: #{a.inspect}"
  end
end

#========================================================================
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

#========================================================================
abort "usage: ruby mkaerocal.rb squadronFile1.xml [...]" if ARGV.length == 0

# Read aerodrome names and make a record in @aerodromes for each
inf = File.new("gazetteer.xml", "r", encoding: 'utf-8')
gDoc = Document.new inf
gDoc.elements.each('gazetteer/location') do |loc|
  @aerodromes[loc.attributes['name'].encode("ISO-8859-1")] = { 'dates' => [] }
end

# Read squadron data
ARGV.each do |filename|
  inf = File.new(filename, "r", encoding: 'utf-8')
  jDoc = Document.new inf
  jDoc.elements.each('squadrons/squadron') do |sq|
    num    = sq.attributes['num']
    nation = sq.attributes['nation']
    type   = sq.attributes['type']

    sq.elements.each('location') do |loc|
      locName  = loc.attributes['name'].encode("ISO-8859-1")
      fromDate = canonicalizeDateStr(loc.attributes['fromDate'])
      toDate   = canonicalizeDateStr(loc.attributes['toDate'])
      addRecordData(locName, [nation, type, num], fromDate, toDate)

      startDates[fromDate] = 1 if fromDate  # omit 0
      endDates[toDate]     = 1 if toDate    # omit 0
    end
  end
  inf.close
end

# Write out calendar info
first = true
outf = File.new('aerodromeCalendar.js', 'w', encoding: 'utf-8')
outf.puts("// Created by mkaerocal.rb from jastas.xml and gazetteer.xml on " + `date` + "\n")
outf.puts("var aerodromeCalendar = {")
@aerodromes.keys().sort().each do |loc|
  outf.puts "," if !first
  first = false

  outf.puts("  \"#{loc}\" : [")
  lines = []
  @aerodromes[loc]["dates"].each do |rec|
    lines.push("[" + rec[0] + "," + rec[1] + "," + rec[2].inspect + "]")
  end
  outf.puts("        " + lines.join(",\n        ")) if lines.length > 0
  outf.print("        ]")
end
outf.puts
outf.puts("};")

# Write out the timeline diffs
outf = File.new('changedates.js', 'w', encoding: 'utf-8')
outf.puts("// Created by mkaerocal.rb from jastas.xml on " + `date` + "\n")
outf.puts("var startChangeDates = [")
outf.puts("    " + startDates.keys().sort().join(",\n    "))
outf.puts("];")
outf.puts("var endChangeDates = [")
outf.puts("    " + endDates.keys().sort().join(",\n    "))
outf.puts("];")
outf.close
