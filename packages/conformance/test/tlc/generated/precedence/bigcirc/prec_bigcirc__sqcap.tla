(*---
description: Groups \bigcirc against \sqcap, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_bigcirc__sqcap ----
EXTENDS TLC
a \bigcirc b == <<"\\bigcirc", a, b>>
a \sqcap b == <<"\\sqcap", a, b>>
Test == PrintT(1 \bigcirc 2 \sqcap 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \bigcirc in block line 16, col 18 to line 16, col 25 of module prec_bigcirc__sqcap and \sqcap.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 27.
    | ExtendableExpr starting at line 16, column 16.
    | Expression starting at line 16, column 16.
    | Optional Arguments starting at line 16, column 15.
    | Primitive expression starting at line 16, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_bigcirc__sqcap
    | In module prec_bigcirc__sqcap
    | Could not parse module prec_bigcirc__sqcap from file prec_bigcirc__sqcap.tla
    | *** Errors: 1
    | In module prec_bigcirc__sqcap
    | Could not parse module prec_bigcirc__sqcap from file prec_bigcirc__sqcap.tla
    3002:1 Parsing or semantic analysis failed.
---*)
