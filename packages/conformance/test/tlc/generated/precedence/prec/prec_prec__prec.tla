(*---
description: Groups \prec against \prec, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_prec__prec ----
EXTENDS TLC
a \prec b == <<"\\prec", a, b>>
Test == PrintT(1 \prec 2 \prec 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \prec in block line 15, col 18 to line 15, col 22 of module prec_prec__prec and \prec.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 15, column 24.
    | ExtendableExpr starting at line 15, column 16.
    | Expression starting at line 15, column 16.
    | Optional Arguments starting at line 15, column 15.
    | Primitive expression starting at line 15, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_prec__prec
    | In module prec_prec__prec
    | Could not parse module prec_prec__prec from file prec_prec__prec.tla
    | *** Errors: 1
    | In module prec_prec__prec
    | Could not parse module prec_prec__prec from file prec_prec__prec.tla
    3002:1 Parsing or semantic analysis failed.
---*)
