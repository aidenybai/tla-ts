(*---
description: Groups (.) against \o, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_odot__o ----
EXTENDS TLC
a (.) b == <<"(.)", a, b>>
a \o b == <<"\\o", a, b>>
Test == PrintT(1 (.) 2 \o 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \odot in block line 16, col 18 to line 16, col 20 of module prec_odot__o and \o.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 22.
    | ExtendableExpr starting at line 16, column 16.
    | Expression starting at line 16, column 16.
    | Optional Arguments starting at line 16, column 15.
    | Primitive expression starting at line 16, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_odot__o
    | In module prec_odot__o
    | Could not parse module prec_odot__o from file prec_odot__o.tla
    | *** Errors: 1
    | In module prec_odot__o
    | Could not parse module prec_odot__o from file prec_odot__o.tla
    3002:1 Parsing or semantic analysis failed.
---*)
