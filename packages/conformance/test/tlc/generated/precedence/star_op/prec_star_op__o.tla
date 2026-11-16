(*---
description: Groups \star against \o, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_star_op__o ----
EXTENDS TLC
a \star b == <<"\\star", a, b>>
a \o b == <<"\\o", a, b>>
Test == PrintT(1 \star 2 \o 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \star in block line 16, col 18 to line 16, col 22 of module prec_star_op__o and \o.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 24.
    | ExtendableExpr starting at line 16, column 16.
    | Expression starting at line 16, column 16.
    | Optional Arguments starting at line 16, column 15.
    | Primitive expression starting at line 16, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_star_op__o
    | In module prec_star_op__o
    | Could not parse module prec_star_op__o from file prec_star_op__o.tla
    | *** Errors: 1
    | In module prec_star_op__o
    | Could not parse module prec_star_op__o from file prec_star_op__o.tla
    3002:1 Parsing or semantic analysis failed.
---*)
