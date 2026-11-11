(*---
description: Groups \sqcap against (+), or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_sqcap__oplus ----
EXTENDS TLC
a \sqcap b == <<"\\sqcap", a, b>>
a (+) b == <<"(+)", a, b>>
Test == PrintT(1 \sqcap 2 (+) 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \sqcap in block line 16, col 18 to line 16, col 23 of module prec_sqcap__oplus and \oplus.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 25.
    | ExtendableExpr starting at line 16, column 16.
    | Expression starting at line 16, column 16.
    | Optional Arguments starting at line 16, column 15.
    | Primitive expression starting at line 16, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_sqcap__oplus
    | In module prec_sqcap__oplus
    | Could not parse module prec_sqcap__oplus from file prec_sqcap__oplus.tla
    | *** Errors: 1
    | In module prec_sqcap__oplus
    | Could not parse module prec_sqcap__oplus from file prec_sqcap__oplus.tla
    3002:1 Parsing or semantic analysis failed.
---*)
