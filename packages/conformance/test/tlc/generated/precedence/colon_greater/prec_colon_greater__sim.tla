(*---
description: Groups :> against \sim, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_colon_greater__sim ----
EXTENDS TLC
a :> b == <<":>", a, b>>
a \sim b == <<"\\sim", a, b>>
Test == PrintT(1 :> 2 \sim 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 1
    | line 14, col 1 to line 14, col 24 of module prec_colon_greater__sim
    | Multiple declarations or definitions for symbol :>.  
    | This duplicates the one at line 78, col 1 to line 78, col 27 of module TLC.
    | Semantic errors:
    | *** Errors: 1
    | line 14, col 1 to line 14, col 24 of module prec_colon_greater__sim
    | Operator :> already defined or declared.
    3002:1 Parsing or semantic analysis failed.
---*)
