(*---
description: Groups \asymp against \asymp, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_asymp__asymp ----
EXTENDS TLC
a \asymp b == <<"\\asymp", a, b>>
Test == PrintT(1 \asymp 2 \asymp 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \asymp in block line 15, col 18 to line 15, col 23 of module prec_asymp__asymp and \asymp.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 15, column 25.
    | ExtendableExpr starting at line 15, column 16.
    | Expression starting at line 15, column 16.
    | Optional Arguments starting at line 15, column 15.
    | Primitive expression starting at line 15, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_asymp__asymp
    | In module prec_asymp__asymp
    | Could not parse module prec_asymp__asymp from file prec_asymp__asymp.tla
    | *** Errors: 1
    | In module prec_asymp__asymp
    | Could not parse module prec_asymp__asymp from file prec_asymp__asymp.tla
    3002:1 Parsing or semantic analysis failed.
---*)
