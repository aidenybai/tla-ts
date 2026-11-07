(*---
description: Groups \uplus against \sqcup, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_uplus__sqcup ----
EXTENDS TLC
a \uplus b == <<"\\uplus", a, b>>
a \sqcup b == <<"\\sqcup", a, b>>
Test == PrintT(1 \uplus 2 \sqcup 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \uplus in block line 16, col 18 to line 16, col 23 of module prec_uplus__sqcup and \sqcup.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 25.
    | ExtendableExpr starting at line 16, column 16.
    | Expression starting at line 16, column 16.
    | Optional Arguments starting at line 16, column 15.
    | Primitive expression starting at line 16, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_uplus__sqcup
    | In module prec_uplus__sqcup
    | Could not parse module prec_uplus__sqcup from file prec_uplus__sqcup.tla
    | *** Errors: 1
    | In module prec_uplus__sqcup
    | Could not parse module prec_uplus__sqcup from file prec_uplus__sqcup.tla
    3002:1 Parsing or semantic analysis failed.
---*)
