(*---
description: Groups \ll against \doteq, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_ll__doteq ----
EXTENDS TLC
a \ll b == <<"\\ll", a, b>>
a \doteq b == <<"\\doteq", a, b>>
Test == PrintT(1 \ll 2 \doteq 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \ll in block line 16, col 18 to line 16, col 20 of module prec_ll__doteq and \doteq.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 22.
    | ExtendableExpr starting at line 16, column 16.
    | Expression starting at line 16, column 16.
    | Optional Arguments starting at line 16, column 15.
    | Primitive expression starting at line 16, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_ll__doteq
    | In module prec_ll__doteq
    | Could not parse module prec_ll__doteq from file prec_ll__doteq.tla
    | *** Errors: 1
    | In module prec_ll__doteq
    | Could not parse module prec_ll__doteq from file prec_ll__doteq.tla
    3002:1 Parsing or semantic analysis failed.
---*)
