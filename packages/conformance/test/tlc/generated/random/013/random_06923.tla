(*---
description: Evaluates a random record expression, seed 262, number 6923.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06923 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (CHOOSE r \in [a : {0} \cup {1}] : TRUE), b |-> ((CASE <<>> -> 3 [] OTHER -> 0 < (2 % 3)) /\ ((TRUE \/ FALSE) \/ (1..3 = {1, 2})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06923 failed.
    A non-boolean expression (a tuple) was used as a condition of a CASE. line 14, col 78 to line 14, col 81 of module random_06923
---*)
