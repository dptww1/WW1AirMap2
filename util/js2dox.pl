# -*- perl -*-

use strict;
use warnings;
use diagnostics;
use Carp;
use File::Slurp;
use Parse::RecDescent;
use Pod::Usage;

#$::RD_TRACE=1;
$::RD_HINT=1;

# Check args

my $grammar = q [
  jsprogram: statement_list

  statement_list: statement(s? /[\n;]/) 

  statement: function_decl
           | if_stmt
           | comment
           | block
           | expr
{ print "finished parsing <statement>, remaining text:\n$text\n;" }
 
  function_decl: doxycomment(?) "function" identifier formal_args_decl "{" statement_list "}"
      { print "found function $item{identifier}, args=", @{$item[4]}, "\n" }
#      { print "found function $item{identifier} (docstring: " . ($#{$item[1]} >= 0 ? $item[1][0] : "---") . ") \n" }

  formal_args_decl: "(" comment(s?) formal_arg(s? /,/) ")"
#      { my @a = @{$item[2]}; print "f_a_d: ", join(',', @a), "\n"; $return = $item[2]; }
      { $return = $item[2] }
  
  formal_arg: identifier comment(s?)

  comment: "//" /.*\n/
         | doxycomment
         | "/*" /([^*]|\*[^\/])*/m "*/"

  doxycomment: "/**" /([^*]|\*[^\/])*/m "*/"
      { print "found doxycomment\n"; $return = $item[2] }

  if_stmt: "if" "(" expr ")" statement_or_block

  statement_or_block: block
                    | statement

  block: "{" statement_list "}"

  expr: unary_op(?) simple_expr binop_expr(s?)

  unary_op: /-!/

  simple_expr: /(true)|(false)|(\d+(.\d+)?)/
             | qualified_identifier

  qualified_identifier: identifier(s? /\./)

  binop_expr: binop expr

  binop: one_char_binop | multi_char_binop

  one_char_binop: /\+-\*\/%<>=/

  multi_char_binop: "&&" | "||" | "<=" | ">=" | ">>" | "<<"

  identifier: /[A-Za-z_][A-Za-z0-9_]*/
];

my $parser = new Parse::RecDescent($grammar) or die "Bad grammar!\n";

foreach my $fileName (@ARGV) {
    # Read input file
    my $text = read_file($fileName);
    
    # Create output file

    # Parse file
    defined $parser->jsprogram($text) or die "text in $fileName doesn't conform to current grammar!\n";

}
