(*---
description: Evaluates a random bool expression, seed 262, number 8794.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08794 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(CHOOSE f \in [2..1 -> 1..2] : TRUE) EXCEPT ![Len(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0))] = Cardinality(({1, 2} \cap Nat))] < DOMAIN [b13628 \in {b13629 \in Nat : TRUE} |-> IF FALSE THEN b13628 ELSE 1]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 19 to line 14, col 52 of module random_08794
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08794 failed.
    2266:0 The first argument of < should be an integer, but instead it is:
    <<>>
---*)
