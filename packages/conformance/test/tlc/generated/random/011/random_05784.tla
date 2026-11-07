(*---
description: Evaluates a random record expression, seed 262, number 5784.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05784 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = Cardinality({b8914 \in (1..3 \cap [x \in Nat |-> x + 1]) : (b8914 = 7)})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05784 failed.
    Attempted to check if the value:
    1
    is an element of the function [x \in Nat |-> <expression line 14, col 120 to line 14, col 124 of module random_05784>]
---*)
