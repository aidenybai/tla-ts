(*---
description: Evaluates a random record expression, seed 262, number 7158.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07158 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((Len([a |-> 1]) .. (0 * 2)) \cap ((0 + 2) .. ([x \in Nat |-> x + 1])[7])) EXCEPT !.a = (((CHOOSE r \in [a : {1, 2}] : TRUE)).a % (CHOOSE b11005 \in {2147483647, 0} : (b11005 = b11005)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07158 failed.
    2283:0 The argument of Len should be a sequence, but instead it is:
    [a |-> 1]
---*)
