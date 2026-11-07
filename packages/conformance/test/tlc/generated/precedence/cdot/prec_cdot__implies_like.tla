(*---
description: Groups \cdot against -+->, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_cdot__implies_like ----
EXTENDS TLC
a \cdot b == <<"\\cdot", a, b>>
a -+-> b == <<"-+->", a, b>>
Test == PrintT(1 \cdot 2 -+-> 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 4
    | line 14, col 1 to line 14, col 31 of module prec_cdot__implies_like
    | Operator \cdot already defined or declared.
    | line 14, col 1 to line 14, col 31 of module prec_cdot__implies_like
    | Symbol \cdot is a built-in operator, and cannot be redefined.
    | line 15, col 1 to line 15, col 28 of module prec_cdot__implies_like
    | Operator -+-> already defined or declared.
    | line 15, col 1 to line 15, col 28 of module prec_cdot__implies_like
    | Symbol -+-> is a built-in operator, and cannot be redefined.
    3002:1 Parsing or semantic analysis failed.
---*)
