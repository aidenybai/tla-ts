(*---
description: Evaluates a random record expression, seed 262, number 60.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00060 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (LET b86 == IF FALSE THEN 2 ELSE -1 IN (CHOOSE b87 \in Nat : FALSE) * ((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) = (CHOOSE r \in [a : 2..1] : TRUE))), b |-> (((CHOOSE f \in [{} -> 1..2] : TRUE))[(2147483647 \div 0)] \in DOMAIN [[x \in Nat |-> x + 1] EXCEPT ![1] = FALSE])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00060 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 63 to line 14, col 88 of module random_00060
---*)
