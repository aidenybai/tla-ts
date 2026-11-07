(*---
description: Groups (.) against \bigcirc, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_odot__bigcirc ----
EXTENDS TLC
a (.) b == <<"(.)", a, b>>
a \bigcirc b == <<"\\bigcirc", a, b>>
Test == PrintT(1 (.) 2 \bigcirc 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \odot in block line 16, col 18 to line 16, col 20 of module prec_odot__bigcirc and \bigcirc.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 22.
    | ExtendableExpr starting at line 16, column 16.
    | Expression starting at line 16, column 16.
    | Optional Arguments starting at line 16, column 15.
    | Primitive expression starting at line 16, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_odot__bigcirc
    | In module prec_odot__bigcirc
    | Could not parse module prec_odot__bigcirc from file prec_odot__bigcirc.tla
    | *** Errors: 1
    | In module prec_odot__bigcirc
    | Could not parse module prec_odot__bigcirc from file prec_odot__bigcirc.tla
    3002:1 Parsing or semantic analysis failed.
---*)
