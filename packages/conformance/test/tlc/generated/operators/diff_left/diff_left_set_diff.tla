(*---
description: diff_left applied to set_diff, a SetDiffValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_left_set_diff ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({1, 2} \ {2} \ {1})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \ in block line 14, col 23 to line 14, col 23 of module diff_left_set_diff and \.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 25.
    | ExtendableExpr starting at line 14, column 16.
    | Expression starting at line 14, column 16.
    | Optional Arguments starting at line 14, column 15.
    | Primitive expression starting at line 14, column 9.
    | Fatal errors while parsing TLA+ spec in file diff_left_set_diff
    | In module diff_left_set_diff
    | Could not parse module diff_left_set_diff from file diff_left_set_diff.tla
    | *** Errors: 1
    | In module diff_left_set_diff
    | Could not parse module diff_left_set_diff from file diff_left_set_diff.tla
    3002:1 Parsing or semantic analysis failed.
---*)
