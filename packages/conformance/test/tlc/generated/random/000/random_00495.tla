(*---
description: Evaluates a random seq expression, seed 262, number 495.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00495 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail([[([a |-> 1] = [a |-> 1]) EXCEPT ![1] = (-0)] EXCEPT ![1] = ((CHOOSE b822 \in {2, 1, 3} : FALSE) * IF [a |-> 1] THEN 7 ELSE 2147483647)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00495 failed.
    Attempted to apply EXCEPT construct to the value TRUE.
---*)
