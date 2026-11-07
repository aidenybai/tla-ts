(*---
description: Groups (\X) against \div, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_otimes__div ----
EXTENDS TLC
a (\X) b == <<"(\\X)", a, b>>
a \div b == <<"\\div", a, b>>
Test == PrintT(1 (\X) 2 \div 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \otimes in block line 16, col 18 to line 16, col 21 of module prec_otimes__div and \div.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 23.
    | ExtendableExpr starting at line 16, column 16.
    | Expression starting at line 16, column 16.
    | Optional Arguments starting at line 16, column 15.
    | Primitive expression starting at line 16, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_otimes__div
    | In module prec_otimes__div
    | Could not parse module prec_otimes__div from file prec_otimes__div.tla
    | *** Errors: 1
    | In module prec_otimes__div
    | Could not parse module prec_otimes__div from file prec_otimes__div.tla
    3002:1 Parsing or semantic analysis failed.
---*)
