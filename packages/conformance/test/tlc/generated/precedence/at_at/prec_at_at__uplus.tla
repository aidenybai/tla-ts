(*---
description: Groups @@ against \uplus, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_at_at__uplus ----
EXTENDS TLC
a @@ b == <<"@@", a, b>>
a \uplus b == <<"\\uplus", a, b>>
Test == PrintT(1 @@ 2 \uplus 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 1
    | line 14, col 1 to line 14, col 24 of module prec_at_at__uplus
    | Multiple declarations or definitions for symbol @@.  
    | This duplicates the one at line 79, col 1 to line 80, col 50 of module TLC.
    | Semantic errors:
    | *** Errors: 1
    | line 14, col 1 to line 14, col 24 of module prec_at_at__uplus
    | Operator @@ already defined or declared.
    3002:1 Parsing or semantic analysis failed.
---*)
