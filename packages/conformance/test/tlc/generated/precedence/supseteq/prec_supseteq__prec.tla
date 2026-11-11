(*---
description: Groups \supseteq against \prec, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_supseteq__prec ----
EXTENDS TLC
a \supseteq b == <<"\\supseteq", a, b>>
a \prec b == <<"\\prec", a, b>>
Test == PrintT(1 \supseteq 2 \prec 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \supseteq in block line 16, col 18 to line 16, col 26 of module prec_supseteq__prec and \prec.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 28.
    | ExtendableExpr starting at line 16, column 16.
    | Expression starting at line 16, column 16.
    | Optional Arguments starting at line 16, column 15.
    | Primitive expression starting at line 16, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_supseteq__prec
    | In module prec_supseteq__prec
    | Could not parse module prec_supseteq__prec from file prec_supseteq__prec.tla
    | *** Errors: 1
    | In module prec_supseteq__prec
    | Could not parse module prec_supseteq__prec from file prec_supseteq__prec.tla
    3002:1 Parsing or semantic analysis failed.
---*)
