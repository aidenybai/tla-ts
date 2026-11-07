(*---
description: Evaluates a random function expression, seed 262, number 3746.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03746 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Head(<<5, 6>>) % (2 + 0)) * Len(SubSeq(<<1, 2>>, 0, [x \in 1..2 |-> x]))) :> LET b5910 == (([x \in 1..2 |-> x])[2] * Len(<<1>>)) IN (CHOOSE b5911 \in UNION {Nat, [x \in 1..2 |-> x]} : (\A b5912 \in Nat : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The third argument of SubSeq should be a natural number, but instead it is:
    <<1, 2>>
    2169:0 The third argument of SubSeq should be a natural number, but instead it is:
    <<1, 2>>
---*)
