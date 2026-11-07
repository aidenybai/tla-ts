(*---
description: interval_high applied to interval_empty, a IntervalValue.
ref: tlc2/module/Naturals.java#DotDot
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE interval_high_interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(1 .. 3..1)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops .. in block line 14, col 18 to line 14, col 19 of module interval_high_interval_empty and ...
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 21.
    | ExtendableExpr starting at line 14, column 16.
    | Expression starting at line 14, column 16.
    | Optional Arguments starting at line 14, column 15.
    | Primitive expression starting at line 14, column 9.
    | Fatal errors while parsing TLA+ spec in file interval_high_interval_empty
    | In module interval_high_interval_empty
    | Could not parse module interval_high_interval_empty from file interval_high_interval_empty.tla
    | *** Errors: 1
    | In module interval_high_interval_empty
    | Could not parse module interval_high_interval_empty from file interval_high_interval_empty.tla
    3002:1 Parsing or semantic analysis failed.
---*)
