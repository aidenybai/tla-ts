(*---
description: Evaluates a random record expression, seed 262, number 4364.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04364 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(((2 * 7) - Head(<<>>)) \div ((-1 + 7) + (-0))) EXCEPT !.a = @ + (((CHOOSE r \in [a : {2, 1, 3}] : TRUE) % (CHOOSE f \in [{} -> {1, 2} \ {1}] : TRUE)) \div ((3 % -1) % (7 \div 1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04364 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
