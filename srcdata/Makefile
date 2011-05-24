# $Id: $

RUBY = ruby

# CAN USE ANT FOR THIS NOW
#sources.html: sources.xml byissue.xslt
#	java org.apache.xalan.xslt.Process -IN sources.xml -XSL byissue.xslt -OUT sources.html

.PHONY: missing all refpts

all: 
	$(RUBY) mkgazetteer.rb
	$(RUBY) mkaerocal.rb squadrons-*.xml
	$(RUBY) mksquadrons.rb squadrons-*.xml
	mv *.js ../data

missing: 
	grep location gazetteer.xml | grep -v mapLoc | grep -v Macedonia | grep -v Italy | grep -v Turkey | grep -v Austria | grep -v Britain

reconcile:
	$(RUBY) reconcile.rb squadrons-*.xml

refpts:
	$(RUBY) refpts.rb
		