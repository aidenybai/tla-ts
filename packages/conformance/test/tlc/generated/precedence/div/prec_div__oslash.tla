(*---
description: Groups \div against (/), or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_div__oslash ----
EXTENDS TLC
a \div b == <<"\\div", a, b>>
a (/) b == <<"(/)", a, b>>
Test == PrintT(1 \div 2 (/) 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 16, col 18 to line 16, col 21 of module prec_div__oslash and \oslash.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 23.
    | ExtendableExpr starting at line 16, column 16.
    | Expression starting at line 16, column 16.
    | Optional Arguments starting at line 16, column 15.
    | Primitive expression starting at line 16, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_div__oslash
    | In module prec_div__oslash
    | Could not parse module prec_div__oslash from file prec_div__oslash.tla
    | *** Errors: 1
    | In module prec_div__oslash
    | Could not parse module prec_div__oslash from file prec_div__oslash.tla
    3002:1 Parsing or semantic analysis failed.
---*)
