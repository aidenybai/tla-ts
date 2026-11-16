(*---
description: Evaluates a random int expression, seed 262, number 1154.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01154 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((~(LET b1851 == {x \in 1..3 : x > 1} IN 0 < (1 :> 0))) <=> (((FALSE => TRUE) => (FALSE \/ TRUE)) /\ ((\A b1852 \in {x \in 1..3 : x > 1} : TRUE) /\ (FALSE /\ FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01154 failed.
    2266:0 The second argument of < should be an integer, but instead it is:
    <<0>>
---*)
