(*---
description: diff_left applied to set_cup, a SetCupValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_left_set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({1} \cup {2} \ {1})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \union in block line 14, col 20 to line 14, col 23 of module diff_left_set_cup and \.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 25.
    | ExtendableExpr starting at line 14, column 16.
    | Expression starting at line 14, column 16.
    | Optional Arguments starting at line 14, column 15.
    | Primitive expression starting at line 14, column 9.
    | Fatal errors while parsing TLA+ spec in file diff_left_set_cup
    | In module diff_left_set_cup
    | Could not parse module diff_left_set_cup from file diff_left_set_cup.tla
    | *** Errors: 1
    | In module diff_left_set_cup
    | Could not parse module diff_left_set_cup from file diff_left_set_cup.tla
    3002:1 Parsing or semantic analysis failed.
---*)
