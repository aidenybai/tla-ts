(*---
description: Groups @@ against -+->, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_at_at__implies_like ----
EXTENDS TLC
a @@ b == <<"@@", a, b>>
a -+-> b == <<"-+->", a, b>>
Test == PrintT(1 @@ 2 -+-> 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 1
    | line 14, col 1 to line 14, col 24 of module prec_at_at__implies_like
    | Multiple declarations or definitions for symbol @@.  
    | This duplicates the one at line 79, col 1 to line 80, col 50 of module TLC.
    | Semantic errors:
    | *** Errors: 3
    | line 14, col 1 to line 14, col 24 of module prec_at_at__implies_like
    | Operator @@ already defined or declared.
    | line 15, col 1 to line 15, col 28 of module prec_at_at__implies_like
    | Operator -+-> already defined or declared.
    | line 15, col 1 to line 15, col 28 of module prec_at_at__implies_like
    | Symbol -+-> is a built-in operator, and cannot be redefined.
    3002:1 Parsing or semantic analysis failed.
---*)
