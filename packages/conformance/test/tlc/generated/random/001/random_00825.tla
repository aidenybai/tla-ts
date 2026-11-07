(*---
description: Evaluates a random record expression, seed 262, number 825.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00825 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ((0 % 3) % (2147483647 * 0)), b |-> ((2 * 0) < (Nat \cup {2, 1, 3}))] EXCEPT !.a = @ + (-Len(Append(<<>>, 2)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
