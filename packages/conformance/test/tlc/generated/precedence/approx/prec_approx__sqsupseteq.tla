(*---
description: Groups \approx against \sqsupseteq, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_approx__sqsupseteq ----
EXTENDS TLC
a \approx b == <<"\\approx", a, b>>
a \sqsupseteq b == <<"\\sqsupseteq", a, b>>
Test == PrintT(1 \approx 2 \sqsupseteq 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \approx in block line 16, col 18 to line 16, col 24 of module prec_approx__sqsupseteq and \sqsupseteq.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 26.
    | ExtendableExpr starting at line 16, column 16.
    | Expression starting at line 16, column 16.
    | Optional Arguments starting at line 16, column 15.
    | Primitive expression starting at line 16, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_approx__sqsupseteq
    | In module prec_approx__sqsupseteq
    | Could not parse module prec_approx__sqsupseteq from file prec_approx__sqsupseteq.tla
    | *** Errors: 1
    | In module prec_approx__sqsupseteq
    | Could not parse module prec_approx__sqsupseteq from file prec_approx__sqsupseteq.tla
    3002:1 Parsing or semantic analysis failed.
---*)
