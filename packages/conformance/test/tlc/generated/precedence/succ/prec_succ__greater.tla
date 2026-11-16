(*---
description: Groups \succ against >, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_succ__greater ----
EXTENDS TLC
a \succ b == <<"\\succ", a, b>>
a > b == <<">", a, b>>
Test == PrintT(1 \succ 2 > 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \succ in block line 16, col 18 to line 16, col 22 of module prec_succ__greater and >.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 24.
    | ExtendableExpr starting at line 16, column 16.
    | Expression starting at line 16, column 16.
    | Optional Arguments starting at line 16, column 15.
    | Primitive expression starting at line 16, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_succ__greater
    | In module prec_succ__greater
    | Could not parse module prec_succ__greater from file prec_succ__greater.tla
    | *** Errors: 1
    | In module prec_succ__greater
    | Could not parse module prec_succ__greater from file prec_succ__greater.tla
    3002:1 Parsing or semantic analysis failed.
---*)
