(*---
description: Evaluates a random function expression, seed 262, number 6682.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06682 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = (Cardinality({x \in 1..3 : x > 1}) * (-2147483647))] :> (Len(SubSeq(2..1, 0, 1)) % ([[x \in 1..2 |-> x] EXCEPT ![3] = 7])[(7 + 3)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2*-2147483647
    2178:0 Overflow when computing 2*-2147483647
---*)
