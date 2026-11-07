(*---
description: Groups \gg against \supseteq, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_gg__supseteq ----
EXTENDS TLC
a \gg b == <<"\\gg", a, b>>
a \supseteq b == <<"\\supseteq", a, b>>
Test == PrintT(1 \gg 2 \supseteq 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \gg in block line 16, col 18 to line 16, col 20 of module prec_gg__supseteq and \supseteq.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 22.
    | ExtendableExpr starting at line 16, column 16.
    | Expression starting at line 16, column 16.
    | Optional Arguments starting at line 16, column 15.
    | Primitive expression starting at line 16, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_gg__supseteq
    | In module prec_gg__supseteq
    | Could not parse module prec_gg__supseteq from file prec_gg__supseteq.tla
    | *** Errors: 1
    | In module prec_gg__supseteq
    | Could not parse module prec_gg__supseteq from file prec_gg__supseteq.tla
    3002:1 Parsing or semantic analysis failed.
---*)
