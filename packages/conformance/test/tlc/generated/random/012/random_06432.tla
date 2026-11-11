(*---
description: Evaluates a random function expression, seed 262, number 6432.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06432 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b9897 \in {(-(CHOOSE b9898 \in 0 : TRUE)), IF (~FALSE) THEN IF FALSE THEN 2 ELSE 2 ELSE CASE FALSE -> 3 [] OTHER -> <<3, 1, 2>>} |-> (CHOOSE b9899 \in (({} \cup Nat) \ {0, b9897}) : (\E b9900 \in (2147483647 .. -1) : (TRUE /\ TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06432 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 31 to line 14, col 55 of module random_06432
---*)
