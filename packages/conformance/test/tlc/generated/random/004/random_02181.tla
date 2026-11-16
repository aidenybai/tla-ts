(*---
description: Evaluates a random int expression, seed 262, number 2181.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02181 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([TRUE EXCEPT ![7] = [x \in Nat |-> x + 1]] @@ [[x \in Nat |-> x + 1] EXCEPT ![1] = 1]) @@ ((<<5, 6>> @@ <<5, 6>>) @@ (2 :> 2))))[Cardinality({b3440 \in {b3441 \in 2..1 : FALSE} : (b3440 = b3440)})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02181 failed.
    Attempted to apply EXCEPT construct to the value TRUE.
---*)
