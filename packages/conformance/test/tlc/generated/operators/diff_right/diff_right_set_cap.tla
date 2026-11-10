(*---
description: diff_right applied to set_cap, a SetCapValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_right_set_cap ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({1, 2} \ {1, 2} \cap {2, 3})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \ in block line 14, col 23 to line 14, col 23 of module diff_right_set_cap and \intersect.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 25.
    | ExtendableExpr starting at line 14, column 16.
    | Expression starting at line 14, column 16.
    | Optional Arguments starting at line 14, column 15.
    | Primitive expression starting at line 14, column 9.
    | Fatal errors while parsing TLA+ spec in file diff_right_set_cap
    | In module diff_right_set_cap
    | Could not parse module diff_right_set_cap from file diff_right_set_cap.tla
    | *** Errors: 1
    | In module diff_right_set_cap
    | Could not parse module diff_right_set_cap from file diff_right_set_cap.tla
    3002:1 Parsing or semantic analysis failed.
---*)
