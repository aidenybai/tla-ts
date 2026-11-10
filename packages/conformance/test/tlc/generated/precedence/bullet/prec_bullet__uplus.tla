(*---
description: Groups \bullet against \uplus, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_bullet__uplus ----
EXTENDS TLC
a \bullet b == <<"\\bullet", a, b>>
a \uplus b == <<"\\uplus", a, b>>
Test == PrintT(1 \bullet 2 \uplus 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \bullet in block line 16, col 18 to line 16, col 24 of module prec_bullet__uplus and \uplus.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 26.
    | ExtendableExpr starting at line 16, column 16.
    | Expression starting at line 16, column 16.
    | Optional Arguments starting at line 16, column 15.
    | Primitive expression starting at line 16, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_bullet__uplus
    | In module prec_bullet__uplus
    | Could not parse module prec_bullet__uplus from file prec_bullet__uplus.tla
    | *** Errors: 1
    | In module prec_bullet__uplus
    | Could not parse module prec_bullet__uplus from file prec_bullet__uplus.tla
    3002:1 Parsing or semantic analysis failed.
---*)
