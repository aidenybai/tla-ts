(*---
description: plus_right applied to cross, a SetOfTuplesValue.
ref: tlc2/module/Naturals.java#Plus
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE plus_right_cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(1 + {1, 2} \X {3})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops + in block line 14, col 18 to line 14, col 18 of module plus_right_cross and \times.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 20.
    | ExtendableExpr starting at line 14, column 16.
    | Expression starting at line 14, column 16.
    | Optional Arguments starting at line 14, column 15.
    | Primitive expression starting at line 14, column 9.
    | Fatal errors while parsing TLA+ spec in file plus_right_cross
    | In module plus_right_cross
    | Could not parse module plus_right_cross from file plus_right_cross.tla
    | *** Errors: 1
    | In module plus_right_cross
    | Could not parse module plus_right_cross from file plus_right_cross.tla
    3002:1 Parsing or semantic analysis failed.
---*)
