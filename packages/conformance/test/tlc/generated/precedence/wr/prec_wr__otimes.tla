(*---
description: Groups \wr against (\X), or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_wr__otimes ----
EXTENDS TLC
a \wr b == <<"\\wr", a, b>>
a (\X) b == <<"(\\X)", a, b>>
Test == PrintT(1 \wr 2 (\X) 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \wr in block line 16, col 18 to line 16, col 20 of module prec_wr__otimes and \otimes.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 22.
    | ExtendableExpr starting at line 16, column 16.
    | Expression starting at line 16, column 16.
    | Optional Arguments starting at line 16, column 15.
    | Primitive expression starting at line 16, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_wr__otimes
    | In module prec_wr__otimes
    | Could not parse module prec_wr__otimes from file prec_wr__otimes.tla
    | *** Errors: 1
    | In module prec_wr__otimes
    | Could not parse module prec_wr__otimes from file prec_wr__otimes.tla
    3002:1 Parsing or semantic analysis failed.
---*)
