(*---
description: bag_minus applied to union, a UnionValue.
ref: tlc2/module/Bags.java#BagDiff
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_minus_union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {{1}, {2}} (-) SetToBag({1}))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops UNION in block line 14, col 16 to line 14, col 20 of module bag_minus_union and \ominus.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 22.
    | Expression starting at line 14, column 16.
    | Optional Arguments starting at line 14, column 15.
    | Primitive expression starting at line 14, column 9.
    | ExtendableExpr starting at line 14, column 9.
    | Fatal errors while parsing TLA+ spec in file bag_minus_union
    | In module bag_minus_union
    | Could not parse module bag_minus_union from file bag_minus_union.tla
    | *** Errors: 1
    | In module bag_minus_union
    | Could not parse module bag_minus_union from file bag_minus_union.tla
    3002:1 Parsing or semantic analysis failed.
---*)
