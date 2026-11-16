(*---
description: Groups -+-> against \star, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_implies_like__star_op ----
EXTENDS TLC
a -+-> b == <<"-+->", a, b>>
a \star b == <<"\\star", a, b>>
Test == PrintT(1 -+-> 2 \star 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 14, col 1 to line 14, col 28 of module prec_implies_like__star_op
    | Operator -+-> already defined or declared.
    | line 14, col 1 to line 14, col 28 of module prec_implies_like__star_op
    | Symbol -+-> is a built-in operator, and cannot be redefined.
    3002:1 Parsing or semantic analysis failed.
---*)
