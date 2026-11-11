(*---
description: Groups \supseteq against \supseteq, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_supseteq__supseteq ----
EXTENDS TLC
a \supseteq b == <<"\\supseteq", a, b>>
Test == PrintT(1 \supseteq 2 \supseteq 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \supseteq in block line 15, col 18 to line 15, col 26 of module prec_supseteq__supseteq and \supseteq.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 15, column 28.
    | ExtendableExpr starting at line 15, column 16.
    | Expression starting at line 15, column 16.
    | Optional Arguments starting at line 15, column 15.
    | Primitive expression starting at line 15, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_supseteq__supseteq
    | In module prec_supseteq__supseteq
    | Could not parse module prec_supseteq__supseteq from file prec_supseteq__supseteq.tla
    | *** Errors: 1
    | In module prec_supseteq__supseteq
    | Could not parse module prec_supseteq__supseteq from file prec_supseteq__supseteq.tla
    3002:1 Parsing or semantic analysis failed.
---*)
