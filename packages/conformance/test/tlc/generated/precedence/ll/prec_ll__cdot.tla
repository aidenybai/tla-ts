(*---
description: Groups \ll against \cdot, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_ll__cdot ----
EXTENDS TLC
a \ll b == <<"\\ll", a, b>>
a \cdot b == <<"\\cdot", a, b>>
Test == PrintT(1 \ll 2 \cdot 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \ll in block line 16, col 18 to line 16, col 20 of module prec_ll__cdot and \cdot.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 22.
    | ExtendableExpr starting at line 16, column 16.
    | Expression starting at line 16, column 16.
    | Optional Arguments starting at line 16, column 15.
    | Primitive expression starting at line 16, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_ll__cdot
    | In module prec_ll__cdot
    | Could not parse module prec_ll__cdot from file prec_ll__cdot.tla
    | *** Errors: 1
    | In module prec_ll__cdot
    | Could not parse module prec_ll__cdot from file prec_ll__cdot.tla
    3002:1 Parsing or semantic analysis failed.
---*)
