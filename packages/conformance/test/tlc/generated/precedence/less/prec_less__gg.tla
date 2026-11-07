(*---
description: Groups < against \gg, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_less__gg ----
EXTENDS TLC
a < b == <<"<", a, b>>
a \gg b == <<"\\gg", a, b>>
Test == PrintT(1 < 2 \gg 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops < in block line 16, col 18 to line 16, col 18 of module prec_less__gg and \gg.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 20.
    | ExtendableExpr starting at line 16, column 16.
    | Expression starting at line 16, column 16.
    | Optional Arguments starting at line 16, column 15.
    | Primitive expression starting at line 16, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_less__gg
    | In module prec_less__gg
    | Could not parse module prec_less__gg from file prec_less__gg.tla
    | *** Errors: 1
    | In module prec_less__gg
    | Could not parse module prec_less__gg from file prec_less__gg.tla
    3002:1 Parsing or semantic analysis failed.
---*)
