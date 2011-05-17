unless ARGV.length > 0
    puts "usage: ruby csvtoxml.rb file1.csv [...]"
    exit
end

journalNumToSeason = { "OTF" => { "1" => "Spring", "2" => "Summer", "3" => "Fall", "4" => "Winter" } }

def clean(str)
    if (str && str.length > 0)
        # kill newlines
        str.chomp!
        
        # If it's quoted because of CSV export, kill the quotes and get rid of internal doubled quotes
        if /^".*"$/.match(str)
            str.gsub!(/(^")|("$)/, "")
            str.gsub!(/""/, '"')
        end

        # Escape problematic XML characters
        str.gsub!(/&/, '&amp;')
        str.gsub!(/"/, '&quot;')
    end

    return str
end

ARGV.each do |filename|
#    puts filename.gsub(/\.csv$/, ".xml")
    outf = File.open(filename.gsub(/\.csv$/, ".xml"), "w")
    outf.puts("<?xml version='1.0' encoding='iso-8859-1'?>")
    outf.puts
    outf.puts("<sources>")
    outf.puts("    <journal name='' abbrevName=''>")

    File.open(filename) do |file|
        id = 1
        journal = "?"
        vol     = "?"
        num     = "?"
        
        file.each_line do |line|
            line.chomp;

            next if line =~ /^Journal\t/  # skip initial header line
            newjournal, newvol, newnum, title, part, subtitle, @notes = line.split(/\t/)

            title    = clean(title)
            subtitle = clean(subtitle)

            if newnum.length > 0
                journal = newjournal
                vol     = newvol
                num     = newnum
                yr      = 1985 + vol.to_i
                season  = journalNumToSeason[journal][num]
#                puts "j#{journal} v#{vol} ##{num}"
                id = 1
                outf.puts("        </issue>") if vol != "1" or num != "1"
                outf.puts("        <issue volume=\"#{vol}\" number=\"#{num}\" year=\"#{yr}\" season=\"#{season}\">") if newnum
            end

            outf.print(" " * 12 + "<article id=\"#{journal}_#{vol}_#{num}_#{id}\" title=\"#{title}\"")
            outf.print(" part=\"#{part}\"")         if part && part.length > 0
            outf.print(" subtitle=\"#{subtitle}\"") if subtitle && subtitle.length > 0
            outf.puts("/>")
            id += 1
        end
    end

    outf.puts("        </issue>")
    outf.puts("    </journal>")
    outf.puts("</sources>")
    outf.close
end

