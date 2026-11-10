(*---
description: Evaluates a random record expression, seed 262, number 415.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00415 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1, b |-> TRUE] EXCEPT !.a = 7] EXCEPT !.a = (CHOOSE b677 \in {1, 2} : TRUE)] EXCEPT !.a = @ + LET b678 == (-3) IN (2147483647 + 0)] EXCEPT !.a = ((LET b679 == 3 IN b679 - Len(<<3, 1, 2>>)) + ((0 * 7) % (2 % 2)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00415 failed.
    2178:0 Overflow when computing 1+2147483647
---*)
