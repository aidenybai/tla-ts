(*---
description: Groups \o against (/), or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_o__oslash ----
EXTENDS TLC
a \o b == <<"\\o", a, b>>
a (/) b == <<"(/)", a, b>>
Test == PrintT(1 \o 2 (/) 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \o in block line 16, col 18 to line 16, col 19 of module prec_o__oslash and \oslash.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 21.
    | ExtendableExpr starting at line 16, column 16.
    | Expression starting at line 16, column 16.
    | Optional Arguments starting at line 16, column 15.
    | Primitive expression starting at line 16, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_o__oslash
    | In module prec_o__oslash
    | Could not parse module prec_o__oslash from file prec_o__oslash.tla
    | *** Errors: 1
    | In module prec_o__oslash
    | Could not parse module prec_o__oslash from file prec_o__oslash.tla
    3002:1 Parsing or semantic analysis failed.
---*)
