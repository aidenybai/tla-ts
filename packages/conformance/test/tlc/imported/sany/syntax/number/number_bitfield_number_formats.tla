(*---
description: Bitfield Number Formats. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/number.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE number_bitfield_number_formats ----
op == \b01010101
op == \B10101010
op == \o01234567
op == \O76543210
op == \h0123456789abcdef
op == \H9876543210FEDCBA
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 5
    | line 10, col 1 to line 10, col 16 of module number_bitfield_number_formats
    | Multiple declarations or definitions for symbol op.  
    | This duplicates the one at line 9, col 1 to line 9, col 16 of module number_bitfield_number_formats.
    | line 11, col 1 to line 11, col 16 of module number_bitfield_number_formats
    | Multiple declarations or definitions for symbol op.  
    | This duplicates the one at line 9, col 1 to line 9, col 16 of module number_bitfield_number_formats.
    | line 12, col 1 to line 12, col 16 of module number_bitfield_number_formats
    | Multiple declarations or definitions for symbol op.  
    | This duplicates the one at line 9, col 1 to line 9, col 16 of module number_bitfield_number_formats.
    | line 13, col 1 to line 13, col 24 of module number_bitfield_number_formats
    | Multiple declarations or definitions for symbol op.  
    | This duplicates the one at line 9, col 1 to line 9, col 16 of module number_bitfield_number_formats.
    | line 14, col 1 to line 14, col 24 of module number_bitfield_number_formats
    | Multiple declarations or definitions for symbol op.  
    | This duplicates the one at line 9, col 1 to line 9, col 16 of module number_bitfield_number_formats.
    | Semantic errors:
    | *** Errors: 5
    | line 10, col 1 to line 10, col 16 of module number_bitfield_number_formats
    | Operator op already defined or declared.
    | line 11, col 1 to line 11, col 16 of module number_bitfield_number_formats
    | Operator op already defined or declared.
    | line 12, col 1 to line 12, col 16 of module number_bitfield_number_formats
    | Operator op already defined or declared.
    | line 13, col 1 to line 13, col 24 of module number_bitfield_number_formats
    | Operator op already defined or declared.
    | line 14, col 1 to line 14, col 24 of module number_bitfield_number_formats
    | Operator op already defined or declared.
    3002:1 Parsing or semantic analysis failed.
---*)
