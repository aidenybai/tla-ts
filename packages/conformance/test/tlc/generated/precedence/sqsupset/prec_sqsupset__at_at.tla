(*---
description: Groups \sqsupset against @@, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_sqsupset__at_at ----
EXTENDS TLC
a \sqsupset b == <<"\\sqsupset", a, b>>
a @@ b == <<"@@", a, b>>
Test == PrintT(1 \sqsupset 2 @@ 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 1
    | line 15, col 1 to line 15, col 24 of module prec_sqsupset__at_at
    | Multiple declarations or definitions for symbol @@.  
    | This duplicates the one at line 79, col 1 to line 80, col 50 of module TLC.
    | Semantic errors:
    | *** Errors: 1
    | line 15, col 1 to line 15, col 24 of module prec_sqsupset__at_at
    | Operator @@ already defined or declared.
    3002:1 Parsing or semantic analysis failed.
---*)
