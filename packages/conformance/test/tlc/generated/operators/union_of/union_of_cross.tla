(*---
description: union_of applied to cross, a SetOfTuplesValue.
ref: tlc2/value/impl/UnionValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE union_of_cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {1, 2} \X {3})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops UNION in block line 14, col 16 to line 14, col 20 of module union_of_cross and \times.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 22.
    | Expression starting at line 14, column 16.
    | Optional Arguments starting at line 14, column 15.
    | Primitive expression starting at line 14, column 9.
    | ExtendableExpr starting at line 14, column 9.
    | Fatal errors while parsing TLA+ spec in file union_of_cross
    | In module union_of_cross
    | Could not parse module union_of_cross from file union_of_cross.tla
    | *** Errors: 1
    | In module union_of_cross
    | Could not parse module union_of_cross from file union_of_cross.tla
    3002:1 Parsing or semantic analysis failed.
---*)
