(*---
description: times_left applied to union, a UnionValue.
ref: tlc2/module/Naturals.java#Times
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE times_left_union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {{1}, {2}} * 2)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops UNION in block line 14, col 16 to line 14, col 20 of module times_left_union and *.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 22.
    | Expression starting at line 14, column 16.
    | Optional Arguments starting at line 14, column 15.
    | Primitive expression starting at line 14, column 9.
    | ExtendableExpr starting at line 14, column 9.
    | Fatal errors while parsing TLA+ spec in file times_left_union
    | In module times_left_union
    | Could not parse module times_left_union from file times_left_union.tla
    | *** Errors: 1
    | In module times_left_union
    | Could not parse module times_left_union from file times_left_union.tla
    3002:1 Parsing or semantic analysis failed.
---*)
