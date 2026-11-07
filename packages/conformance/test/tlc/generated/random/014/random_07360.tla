(*---
description: Evaluates a random function expression, seed 262, number 7360.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07360 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(SubSeq((<<3, 1, 2>> \o <<>>), Cardinality(1..3), LET b11322 == 7 IN b11322)) :> (((SUBSET {1} \cap {x \in 1..3 : x > 1}) @@ ([x \in 1..2 |-> x] @@ [x \in Nat |-> x + 1])))[((7 * 2) - (1 - 2))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    7
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    7
---*)
