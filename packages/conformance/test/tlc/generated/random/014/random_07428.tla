(*---
description: Evaluates a random bool expression, seed 262, number 7428.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07428 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head(Tail(<<1>>)) - (LET b11447 == 2 IN 2147483647 - (3 + -1))) \in ((([a |-> 1] + 1) \div (CHOOSE b11448 \in {2, 1, 3} : TRUE)) .. (IF FALSE THEN 2147483647 ELSE 7 - LET b11449 == 2 IN b11449))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07428 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
