(*---
description: Groups \sqsubset against |=, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_sqsubset__models ----
EXTENDS TLC
a \sqsubset b == <<"\\sqsubset", a, b>>
a |= b == <<"|=", a, b>>
Test == PrintT(1 \sqsubset 2 |= 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \sqsubset in block line 16, col 18 to line 16, col 26 of module prec_sqsubset__models and |=.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 28.
    | ExtendableExpr starting at line 16, column 16.
    | Expression starting at line 16, column 16.
    | Optional Arguments starting at line 16, column 15.
    | Primitive expression starting at line 16, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_sqsubset__models
    | In module prec_sqsubset__models
    | Could not parse module prec_sqsubset__models from file prec_sqsubset__models.tla
    | *** Errors: 1
    | In module prec_sqsubset__models
    | Could not parse module prec_sqsubset__models from file prec_sqsubset__models.tla
    3002:1 Parsing or semantic analysis failed.
---*)
