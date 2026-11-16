(*---
description: interval_low applied to interval, a IntervalValue.
ref: tlc2/module/Naturals.java#DotDot
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE interval_low_interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(1..3 .. 2)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops .. in block line 14, col 17 to line 14, col 18 of module interval_low_interval and ...
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 19.
    | ExtendableExpr starting at line 14, column 16.
    | Expression starting at line 14, column 16.
    | Optional Arguments starting at line 14, column 15.
    | Primitive expression starting at line 14, column 9.
    | Fatal errors while parsing TLA+ spec in file interval_low_interval
    | In module interval_low_interval
    | Could not parse module interval_low_interval from file interval_low_interval.tla
    | *** Errors: 1
    | In module interval_low_interval
    | Could not parse module interval_low_interval from file interval_low_interval.tla
    3002:1 Parsing or semantic analysis failed.
---*)
