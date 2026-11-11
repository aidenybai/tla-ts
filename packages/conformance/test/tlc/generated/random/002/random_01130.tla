(*---
description: Evaluates a random set expression, seed 262, number 1130.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01130 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN ((([x \in 1..2 |-> x])[7] :> (-3)) @@ ((2147483647 % 2) :> (-2147483647))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01130 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    7
    which is not in its domain.
---*)
