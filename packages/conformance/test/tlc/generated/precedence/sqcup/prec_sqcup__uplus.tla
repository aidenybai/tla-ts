(*---
description: Groups \sqcup against \uplus, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_sqcup__uplus ----
EXTENDS TLC
a \sqcup b == <<"\\sqcup", a, b>>
a \uplus b == <<"\\uplus", a, b>>
Test == PrintT(1 \sqcup 2 \uplus 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \sqcup in block line 16, col 18 to line 16, col 23 of module prec_sqcup__uplus and \uplus.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 25.
    | ExtendableExpr starting at line 16, column 16.
    | Expression starting at line 16, column 16.
    | Optional Arguments starting at line 16, column 15.
    | Primitive expression starting at line 16, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_sqcup__uplus
    | In module prec_sqcup__uplus
    | Could not parse module prec_sqcup__uplus from file prec_sqcup__uplus.tla
    | *** Errors: 1
    | In module prec_sqcup__uplus
    | Could not parse module prec_sqcup__uplus from file prec_sqcup__uplus.tla
    3002:1 Parsing or semantic analysis failed.
---*)
