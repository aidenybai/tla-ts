(*---
description: Evaluates a random record expression, seed 262, number 6052.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06052 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (CASE [[a |-> 1] EXCEPT !.a = @ + -1] -> (7 + 1) [] OTHER -> Head(<<1, 2>>) \div ([b9322 \in Nat |-> b9322])[(1 + 3)]), b |-> (\E b9323 \in UNION {({1, 2} \cap {2, 1, 3}), ([a |-> 1]).a} : ((FALSE /\ TRUE) \/ (<<>> = [x \in Nat |-> x + 1])))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06052 failed.
    A non-boolean expression (a record) was used as a condition of a CASE. line 14, col 29 to line 14, col 59 of module random_06052
---*)
