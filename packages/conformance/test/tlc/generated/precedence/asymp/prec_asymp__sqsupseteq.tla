(*---
description: Groups \asymp against \sqsupseteq, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_asymp__sqsupseteq ----
EXTENDS TLC
a \asymp b == <<"\\asymp", a, b>>
a \sqsupseteq b == <<"\\sqsupseteq", a, b>>
Test == PrintT(1 \asymp 2 \sqsupseteq 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \asymp in block line 16, col 18 to line 16, col 23 of module prec_asymp__sqsupseteq and \sqsupseteq.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 25.
    | ExtendableExpr starting at line 16, column 16.
    | Expression starting at line 16, column 16.
    | Optional Arguments starting at line 16, column 15.
    | Primitive expression starting at line 16, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_asymp__sqsupseteq
    | In module prec_asymp__sqsupseteq
    | Could not parse module prec_asymp__sqsupseteq from file prec_asymp__sqsupseteq.tla
    | *** Errors: 1
    | In module prec_asymp__sqsupseteq
    | Could not parse module prec_asymp__sqsupseteq from file prec_asymp__sqsupseteq.tla
    3002:1 Parsing or semantic analysis failed.
---*)
