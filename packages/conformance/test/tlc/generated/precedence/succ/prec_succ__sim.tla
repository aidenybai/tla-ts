(*---
description: Groups \succ against \sim, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_succ__sim ----
EXTENDS TLC
a \succ b == <<"\\succ", a, b>>
a \sim b == <<"\\sim", a, b>>
Test == PrintT(1 \succ 2 \sim 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \succ in block line 16, col 18 to line 16, col 22 of module prec_succ__sim and \sim.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 24.
    | ExtendableExpr starting at line 16, column 16.
    | Expression starting at line 16, column 16.
    | Optional Arguments starting at line 16, column 15.
    | Primitive expression starting at line 16, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_succ__sim
    | In module prec_succ__sim
    | Could not parse module prec_succ__sim from file prec_succ__sim.tla
    | *** Errors: 1
    | In module prec_succ__sim
    | Could not parse module prec_succ__sim from file prec_succ__sim.tla
    3002:1 Parsing or semantic analysis failed.
---*)
