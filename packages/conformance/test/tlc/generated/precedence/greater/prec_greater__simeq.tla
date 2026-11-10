(*---
description: Groups > against \simeq, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_greater__simeq ----
EXTENDS TLC
a > b == <<">", a, b>>
a \simeq b == <<"\\simeq", a, b>>
Test == PrintT(1 > 2 \simeq 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops > in block line 16, col 18 to line 16, col 18 of module prec_greater__simeq and \simeq.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 20.
    | ExtendableExpr starting at line 16, column 16.
    | Expression starting at line 16, column 16.
    | Optional Arguments starting at line 16, column 15.
    | Primitive expression starting at line 16, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_greater__simeq
    | In module prec_greater__simeq
    | Could not parse module prec_greater__simeq from file prec_greater__simeq.tla
    | *** Errors: 1
    | In module prec_greater__simeq
    | Could not parse module prec_greater__simeq from file prec_greater__simeq.tla
    3002:1 Parsing or semantic analysis failed.
---*)
