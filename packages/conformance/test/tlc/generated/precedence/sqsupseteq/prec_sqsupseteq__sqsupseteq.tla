(*---
description: Groups \sqsupseteq against \sqsupseteq, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_sqsupseteq__sqsupseteq ----
EXTENDS TLC
a \sqsupseteq b == <<"\\sqsupseteq", a, b>>
Test == PrintT(1 \sqsupseteq 2 \sqsupseteq 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \sqsupseteq in block line 15, col 18 to line 15, col 28 of module prec_sqsupseteq__sqsupseteq and \sqsupseteq.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 15, column 30.
    | ExtendableExpr starting at line 15, column 16.
    | Expression starting at line 15, column 16.
    | Optional Arguments starting at line 15, column 15.
    | Primitive expression starting at line 15, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_sqsupseteq__sqsupseteq
    | In module prec_sqsupseteq__sqsupseteq
    | Could not parse module prec_sqsupseteq__sqsupseteq from file prec_sqsupseteq__sqsupseteq.tla
    | *** Errors: 1
    | In module prec_sqsupseteq__sqsupseteq
    | Could not parse module prec_sqsupseteq__sqsupseteq from file prec_sqsupseteq__sqsupseteq.tla
    3002:1 Parsing or semantic analysis failed.
---*)
