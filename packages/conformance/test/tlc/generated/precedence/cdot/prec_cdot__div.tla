(*---
description: Groups \cdot against \div, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_cdot__div ----
EXTENDS TLC
a \cdot b == <<"\\cdot", a, b>>
a \div b == <<"\\div", a, b>>
Test == PrintT(1 \cdot 2 \div 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \cdot in block line 16, col 18 to line 16, col 22 of module prec_cdot__div and \div.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 24.
    | ExtendableExpr starting at line 16, column 16.
    | Expression starting at line 16, column 16.
    | Optional Arguments starting at line 16, column 15.
    | Primitive expression starting at line 16, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_cdot__div
    | In module prec_cdot__div
    | Could not parse module prec_cdot__div from file prec_cdot__div.tla
    | *** Errors: 1
    | In module prec_cdot__div
    | Could not parse module prec_cdot__div from file prec_cdot__div.tla
    3002:1 Parsing or semantic analysis failed.
---*)
