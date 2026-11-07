(*---
description: Evaluates a random function expression, seed 262, number 1388.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01388 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE f \in [{} -> {0} \cup {1}] : TRUE) @@ [[b2215 \in {x \in 1..3 : x > 1} |-> 2147483647] EXCEPT ![Len(<<1, 2>>)] = (2 - 2147483647)]) @@ (((CHOOSE r \in [a : {1, 2}] : TRUE) = [a |-> 0, b |-> FALSE]) @@ (((1 :> 2) @@ [x \in 1..2 |-> x]) @@ [[x \in 1..2 |-> x] EXCEPT ![2] = 7]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    FALSE
    2169:0 The first argument of @@ should be a function, but instead it is:
    FALSE
---*)
