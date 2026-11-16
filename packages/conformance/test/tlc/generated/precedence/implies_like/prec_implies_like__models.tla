(*---
description: Groups -+-> against |=, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_implies_like__models ----
EXTENDS TLC
a -+-> b == <<"-+->", a, b>>
a |= b == <<"|=", a, b>>
Test == PrintT(1 -+-> 2 |= 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 14, col 1 to line 14, col 28 of module prec_implies_like__models
    | Operator -+-> already defined or declared.
    | line 14, col 1 to line 14, col 28 of module prec_implies_like__models
    | Symbol -+-> is a built-in operator, and cannot be redefined.
    3002:1 Parsing or semantic analysis failed.
---*)
