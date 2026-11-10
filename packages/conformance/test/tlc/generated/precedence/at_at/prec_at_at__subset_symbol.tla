(*---
description: Groups @@ against \subset, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_at_at__subset_symbol ----
EXTENDS TLC
a @@ b == <<"@@", a, b>>
a \subset b == <<"\\subset", a, b>>
Test == PrintT(1 @@ 2 \subset 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 1
    | line 14, col 1 to line 14, col 24 of module prec_at_at__subset_symbol
    | Multiple declarations or definitions for symbol @@.  
    | This duplicates the one at line 79, col 1 to line 80, col 50 of module TLC.
    | Semantic errors:
    | *** Errors: 1
    | line 14, col 1 to line 14, col 24 of module prec_at_at__subset_symbol
    | Operator @@ already defined or declared.
    3002:1 Parsing or semantic analysis failed.
---*)
