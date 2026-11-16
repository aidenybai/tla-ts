(*---
description: Groups \o against \star, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_o__star_op ----
EXTENDS TLC
a \o b == <<"\\o", a, b>>
a \star b == <<"\\star", a, b>>
Test == PrintT(1 \o 2 \star 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \o in block line 16, col 18 to line 16, col 19 of module prec_o__star_op and \star.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 21.
    | ExtendableExpr starting at line 16, column 16.
    | Expression starting at line 16, column 16.
    | Optional Arguments starting at line 16, column 15.
    | Primitive expression starting at line 16, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_o__star_op
    | In module prec_o__star_op
    | Could not parse module prec_o__star_op from file prec_o__star_op.tla
    | *** Errors: 1
    | In module prec_o__star_op
    | Could not parse module prec_o__star_op from file prec_o__star_op.tla
    3002:1 Parsing or semantic analysis failed.
---*)
