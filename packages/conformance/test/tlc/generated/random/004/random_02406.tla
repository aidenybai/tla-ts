(*---
description: Evaluates a random function expression, seed 262, number 2406.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02406 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((3 % 0) :> (CHOOSE b3809 \in Nat : TRUE)) :> ((2 * 7) % Cardinality({}))) @@ (CHOOSE f \in [2..1 -> 1..2] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
