(*---
description: Groups \sqsupset against \sim, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_sqsupset__sim ----
EXTENDS TLC
a \sqsupset b == <<"\\sqsupset", a, b>>
a \sim b == <<"\\sim", a, b>>
Test == PrintT(1 \sqsupset 2 \sim 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \sqsupset in block line 16, col 18 to line 16, col 26 of module prec_sqsupset__sim and \sim.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 28.
    | ExtendableExpr starting at line 16, column 16.
    | Expression starting at line 16, column 16.
    | Optional Arguments starting at line 16, column 15.
    | Primitive expression starting at line 16, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_sqsupset__sim
    | In module prec_sqsupset__sim
    | Could not parse module prec_sqsupset__sim from file prec_sqsupset__sim.tla
    | *** Errors: 1
    | In module prec_sqsupset__sim
    | Could not parse module prec_sqsupset__sim from file prec_sqsupset__sim.tla
    3002:1 Parsing or semantic analysis failed.
---*)
