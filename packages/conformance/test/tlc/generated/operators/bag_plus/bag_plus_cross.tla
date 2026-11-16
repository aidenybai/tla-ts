(*---
description: bag_plus applied to cross, a SetOfTuplesValue.
ref: tlc2/module/Bags.java#BagUnion
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_plus_cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({1, 2} \X {3} (+) SetToBag({1}))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \times in block line 14, col 23 to line 14, col 24 of module bag_plus_cross and \oplus.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 26.
    | ExtendableExpr starting at line 14, column 16.
    | Expression starting at line 14, column 16.
    | Optional Arguments starting at line 14, column 15.
    | Primitive expression starting at line 14, column 9.
    | Fatal errors while parsing TLA+ spec in file bag_plus_cross
    | In module bag_plus_cross
    | Could not parse module bag_plus_cross from file bag_plus_cross.tla
    | *** Errors: 1
    | In module bag_plus_cross
    | Could not parse module bag_plus_cross from file bag_plus_cross.tla
    3002:1 Parsing or semantic analysis failed.
---*)
