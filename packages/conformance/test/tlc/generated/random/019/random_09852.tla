(*---
description: Evaluates a random seq expression, seed 262, number 9852.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09852 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<(IF FALSE THEN 7 ELSE 0 - (CHOOSE b15296 \in {1, 2} : FALSE)), [a |-> ([x \in Nat |-> x + 1])[0], b |-> (TRUE /\ TRUE)]>> \o <<Cardinality({b15297 : b15297 \in {1, 2}}), Len([<<>> EXCEPT ![1] = -1])>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09852 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 46 to line 14, col 77 of module random_09852
---*)
