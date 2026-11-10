(*---
description: Groups \cong against \succeq, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_cong__succeq ----
EXTENDS TLC
a \cong b == <<"\\cong", a, b>>
a \succeq b == <<"\\succeq", a, b>>
Test == PrintT(1 \cong 2 \succeq 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \cong in block line 16, col 18 to line 16, col 22 of module prec_cong__succeq and \succeq.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 24.
    | ExtendableExpr starting at line 16, column 16.
    | Expression starting at line 16, column 16.
    | Optional Arguments starting at line 16, column 15.
    | Primitive expression starting at line 16, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_cong__succeq
    | In module prec_cong__succeq
    | Could not parse module prec_cong__succeq from file prec_cong__succeq.tla
    | *** Errors: 1
    | In module prec_cong__succeq
    | Could not parse module prec_cong__succeq from file prec_cong__succeq.tla
    3002:1 Parsing or semantic analysis failed.
---*)
