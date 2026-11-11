(*---
description: Groups \wr against ^, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_wr__caret ----
EXTENDS TLC
a \wr b == <<"\\wr", a, b>>
a ^ b == <<"^", a, b>>
Test == PrintT(1 \wr 2 ^ 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \wr in block line 16, col 18 to line 16, col 20 of module prec_wr__caret and ^.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 22.
    | ExtendableExpr starting at line 16, column 16.
    | Expression starting at line 16, column 16.
    | Optional Arguments starting at line 16, column 15.
    | Primitive expression starting at line 16, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_wr__caret
    | In module prec_wr__caret
    | Could not parse module prec_wr__caret from file prec_wr__caret.tla
    | *** Errors: 1
    | In module prec_wr__caret
    | Could not parse module prec_wr__caret from file prec_wr__caret.tla
    3002:1 Parsing or semantic analysis failed.
---*)
