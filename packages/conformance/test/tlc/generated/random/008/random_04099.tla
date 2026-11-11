(*---
description: Evaluates a random record expression, seed 262, number 4099.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04099 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ([[<<5, 6>> EXCEPT ![2147483647] = 2] EXCEPT ![CASE TRUE -> 0 [] OTHER -> 2147483647] = (-1 \div 2147483647)])[([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 1]).a], b |-> ((CHOOSE r \in [a : {2, 1, 3}] : TRUE) = [[a |-> 2147483647, b |-> TRUE] EXCEPT !.a = (1 + 3)])])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 26 to line 14, col 33 of module random_04099
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 25 to line 14, col 59 of module random_04099
    | [a |-> 6, b |-> FALSE]
---*)
