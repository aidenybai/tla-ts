(*---
description: Evaluates a random function expression, seed 262, number 3620.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03620 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((0 - 2147483647) - Tail(<<>>)) % (-(1 % 1))) :> (((-1) + ({1, 2} @@ [x \in 1..2 |-> x])) * ([b5716 \in {1} |-> 2])[(CHOOSE b5717 \in [a |-> 1] : TRUE)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
