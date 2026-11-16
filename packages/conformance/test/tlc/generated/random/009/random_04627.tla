(*---
description: Evaluates a random seq expression, seed 262, number 4627.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04627 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((<<(CHOOSE b7243 \in {1} : FALSE), ([x \in 1..2 |-> x])[2]>> \o SubSeq((Nat \o <<>>), (CHOOSE b7244 \in {1, 2} : TRUE), ([a |-> 1]).a)) \o Tail([(<<1>> \o <<1, 2>>) EXCEPT ![1] = [b7245 \in Nat |-> 1]])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04627 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 21 to line 14, col 48 of module random_04627
---*)
