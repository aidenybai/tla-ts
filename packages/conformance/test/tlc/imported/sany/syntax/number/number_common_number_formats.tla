(*---
description: Common Number Formats. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/number.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE number_common_number_formats ----
op == 12345
op == 12345.12345
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 1
    | line 10, col 1 to line 10, col 17 of module number_common_number_formats
    | Multiple declarations or definitions for symbol op.  
    | This duplicates the one at line 9, col 1 to line 9, col 11 of module number_common_number_formats.
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 1 to line 10, col 17 of module number_common_number_formats
    | Operator op already defined or declared.
    3002:1 Parsing or semantic analysis failed.
---*)
