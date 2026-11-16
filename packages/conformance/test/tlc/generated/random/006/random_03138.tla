(*---
description: Evaluates a random record expression, seed 262, number 3138.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03138 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Cardinality([[a |-> 1] EXCEPT !.a = @ + 2147483647]), b |-> ((0 \in {2, 1, 3}) => (FALSE /\ TRUE))] EXCEPT !.a = (CHOOSE f \in [2..1 -> {1, 2} \cap {2}] : TRUE)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03138 failed.
    2178:0 Overflow when computing 1+2147483647
---*)
