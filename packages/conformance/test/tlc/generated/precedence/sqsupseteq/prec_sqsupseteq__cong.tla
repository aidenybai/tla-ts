(*---
description: Groups \sqsupseteq against \cong, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_sqsupseteq__cong ----
EXTENDS TLC
a \sqsupseteq b == <<"\\sqsupseteq", a, b>>
a \cong b == <<"\\cong", a, b>>
Test == PrintT(1 \sqsupseteq 2 \cong 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \sqsupseteq in block line 16, col 18 to line 16, col 28 of module prec_sqsupseteq__cong and \cong.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 30.
    | ExtendableExpr starting at line 16, column 16.
    | Expression starting at line 16, column 16.
    | Optional Arguments starting at line 16, column 15.
    | Primitive expression starting at line 16, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_sqsupseteq__cong
    | In module prec_sqsupseteq__cong
    | Could not parse module prec_sqsupseteq__cong from file prec_sqsupseteq__cong.tla
    | *** Errors: 1
    | In module prec_sqsupseteq__cong
    | Could not parse module prec_sqsupseteq__cong from file prec_sqsupseteq__cong.tla
    3002:1 Parsing or semantic analysis failed.
---*)
