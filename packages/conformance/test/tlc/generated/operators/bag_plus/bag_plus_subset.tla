(*---
description: bag_plus applied to subset, a SubsetValue.
ref: tlc2/module/Bags.java#BagUnion
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_plus_subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SUBSET {1, 2} (+) SetToBag({1}))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops SUBSET in block line 14, col 16 to line 14, col 21 of module bag_plus_subset and \oplus.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 23.
    | Expression starting at line 14, column 16.
    | Optional Arguments starting at line 14, column 15.
    | Primitive expression starting at line 14, column 9.
    | ExtendableExpr starting at line 14, column 9.
    | Fatal errors while parsing TLA+ spec in file bag_plus_subset
    | In module bag_plus_subset
    | Could not parse module bag_plus_subset from file bag_plus_subset.tla
    | *** Errors: 1
    | In module bag_plus_subset
    | Could not parse module bag_plus_subset from file bag_plus_subset.tla
    3002:1 Parsing or semantic analysis failed.
---*)
