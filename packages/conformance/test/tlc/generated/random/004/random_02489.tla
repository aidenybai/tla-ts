(*---
description: Evaluates a random record expression, seed 262, number 2489.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02489 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([{b3918 \in {b3919 \in ({x \in 1..3 : x > 1} \cup 1..3) : ([a |-> 1] < b3919)} : ((1 \in SUBSET {1}) <=> (TRUE => TRUE))} EXCEPT !.a = @ + (((FALSE <=> 7) <=> ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])) <=> (~SelectSeq(<<>>, LAMBDA e : e > 0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02489 failed.
    2266:0 The first argument of < should be an integer, but instead it is:
    [a |-> 1]
---*)
