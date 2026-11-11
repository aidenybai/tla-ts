(*---
description: Evaluates a random record expression, seed 262, number 5071.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05071 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> IF (\A b7889 \in [a |-> 2147483647, b |-> FALSE] : (\E b7890 \in Nat : TRUE)) THEN (IF TRUE THEN 1 ELSE TRUE + (7 \div 3)) ELSE [[a |-> 2147483647, b |-> SUBSET {1}] EXCEPT !.a = ((1 :> 2))[2147483647]], b |-> (([(1 :> 2) EXCEPT ![2147483647] = 3]).a * IF ([a |-> 1] = [a |-> 1, b |-> TRUE]) THEN (1 + 1) ELSE (-0))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05071 failed.
    TLC encountered a non-enumerable quantifier bound
    [a |-> 2147483647, b |-> FALSE].
    line 14, col 40 to line 14, col 70 of module random_05071
---*)
