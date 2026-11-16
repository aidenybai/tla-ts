(*---
description: Groups \preceq against \supseteq, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_preceq__supseteq ----
EXTENDS TLC
a \preceq b == <<"\\preceq", a, b>>
a \supseteq b == <<"\\supseteq", a, b>>
Test == PrintT(1 \preceq 2 \supseteq 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \preceq in block line 16, col 18 to line 16, col 24 of module prec_preceq__supseteq and \supseteq.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 26.
    | ExtendableExpr starting at line 16, column 16.
    | Expression starting at line 16, column 16.
    | Optional Arguments starting at line 16, column 15.
    | Primitive expression starting at line 16, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_preceq__supseteq
    | In module prec_preceq__supseteq
    | Could not parse module prec_preceq__supseteq from file prec_preceq__supseteq.tla
    | *** Errors: 1
    | In module prec_preceq__supseteq
    | Could not parse module prec_preceq__supseteq from file prec_preceq__supseteq.tla
    3002:1 Parsing or semantic analysis failed.
---*)
