(*---
description: Groups \bigcirc against \cdot, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_bigcirc__cdot ----
EXTENDS TLC
a \bigcirc b == <<"\\bigcirc", a, b>>
a \cdot b == <<"\\cdot", a, b>>
Test == PrintT(1 \bigcirc 2 \cdot 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \bigcirc in block line 16, col 18 to line 16, col 25 of module prec_bigcirc__cdot and \cdot.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 27.
    | ExtendableExpr starting at line 16, column 16.
    | Expression starting at line 16, column 16.
    | Optional Arguments starting at line 16, column 15.
    | Primitive expression starting at line 16, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_bigcirc__cdot
    | In module prec_bigcirc__cdot
    | Could not parse module prec_bigcirc__cdot from file prec_bigcirc__cdot.tla
    | *** Errors: 1
    | In module prec_bigcirc__cdot
    | Could not parse module prec_bigcirc__cdot from file prec_bigcirc__cdot.tla
    3002:1 Parsing or semantic analysis failed.
---*)
