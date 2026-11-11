(*---
description: Evaluates a random seq expression, seed 262, number 7458.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07458 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 1] EXCEPT !.a = @ + (2147483647 * 1)] = (CHOOSE r \in [a : 2..1] : TRUE)) /\ (({0, <<1, 2>>} = ({} \ {1})) \/ ((7 = 1) <=> [a |-> 2147483647, b |-> TRUE]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07458 failed.
    2178:0 Overflow when computing 1+2147483647
---*)
