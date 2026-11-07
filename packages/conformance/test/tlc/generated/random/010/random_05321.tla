(*---
description: Evaluates a random int expression, seed 262, number 5321.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05321 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (({b8229 \in {2, 1, 3} : <<>>} = {b8230 : b8230 \in 1..3}) /\ (~(\E b8231 \in {1} : [a |-> 1, b |-> TRUE]))) THEN Head([([x \in 1..2 |-> x] \o <<1>>) EXCEPT ![1] = (3 \div 7)]) ELSE Cardinality({IF FALSE THEN -1 ELSE b8232 : b8232 \in {b8233 \in {1, 2} : FALSE}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05321 failed.
    Attempted to evaluate an expression of form {x \in S : P(x)} when P was a tuple.
    line 14, col 44 to line 14, col 47 of module random_05321
---*)
