(*---
description: Number Set Definitions. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/number.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE number_number_set_definitions ----
Nat == {}
op == A!Nat
Int == {}
op == A!Int
Real == {}
op == A!Real
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 2
    | line 12, col 1 to line 12, col 11 of module number_number_set_definitions
    | Multiple declarations or definitions for symbol op.  
    | This duplicates the one at line 10, col 1 to line 10, col 11 of module number_number_set_definitions.
    | line 14, col 1 to line 14, col 12 of module number_number_set_definitions
    | Multiple declarations or definitions for symbol op.  
    | This duplicates the one at line 10, col 1 to line 10, col 11 of module number_number_set_definitions.
    | Semantic errors:
    | *** Errors: 5
    | line 10, col 7 to line 10, col 11 of module number_number_set_definitions
    | Unknown operator: `A!Nat'.
    | line 12, col 1 to line 12, col 11 of module number_number_set_definitions
    | Operator op already defined or declared.
    | line 12, col 7 to line 12, col 11 of module number_number_set_definitions
    | Unknown operator: `A!Int'.
    | line 14, col 1 to line 14, col 12 of module number_number_set_definitions
    | Operator op already defined or declared.
    | line 14, col 7 to line 14, col 12 of module number_number_set_definitions
    | Unknown operator: `A!Real'.
    3002:1 Parsing or semantic analysis failed.
---*)
