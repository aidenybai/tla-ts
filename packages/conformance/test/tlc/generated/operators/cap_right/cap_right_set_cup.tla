(*---
description: cap_right applied to set_cup, a SetCupValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_right_set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({1, 2} \cap {1} \cup {2})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \intersect in block line 14, col 23 to line 14, col 26 of module cap_right_set_cup and \union.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 28.
    | ExtendableExpr starting at line 14, column 16.
    | Expression starting at line 14, column 16.
    | Optional Arguments starting at line 14, column 15.
    | Primitive expression starting at line 14, column 9.
    | Fatal errors while parsing TLA+ spec in file cap_right_set_cup
    | In module cap_right_set_cup
    | Could not parse module cap_right_set_cup from file cap_right_set_cup.tla
    | *** Errors: 1
    | In module cap_right_set_cup
    | Could not parse module cap_right_set_cup from file cap_right_set_cup.tla
    3002:1 Parsing or semantic analysis failed.
---*)
