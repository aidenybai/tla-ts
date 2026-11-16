(*---
description: Groups \sqcup against (+), or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_sqcup__oplus ----
EXTENDS TLC
a \sqcup b == <<"\\sqcup", a, b>>
a (+) b == <<"(+)", a, b>>
Test == PrintT(1 \sqcup 2 (+) 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \sqcup in block line 16, col 18 to line 16, col 23 of module prec_sqcup__oplus and \oplus.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 25.
    | ExtendableExpr starting at line 16, column 16.
    | Expression starting at line 16, column 16.
    | Optional Arguments starting at line 16, column 15.
    | Primitive expression starting at line 16, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_sqcup__oplus
    | In module prec_sqcup__oplus
    | Could not parse module prec_sqcup__oplus from file prec_sqcup__oplus.tla
    | *** Errors: 1
    | In module prec_sqcup__oplus
    | Could not parse module prec_sqcup__oplus from file prec_sqcup__oplus.tla
    3002:1 Parsing or semantic analysis failed.
---*)
