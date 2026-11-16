(*---
description: Evaluates a random function expression, seed 262, number 5286.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05286 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b8183 \in {IF TRUE THEN 0 ELSE -1, (CHOOSE b8184 \in {1, 2} : TRUE)} |-> ((<<5, 6>>)[3] * (0 \div b8183))] @@ (((CHOOSE f \in [1..2 -> 1..2] : TRUE) @@ [b8185 \in Nat |-> 0]) @@ [b8186 \in {3, 7} |-> (1 + b8186)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05286 failed.
    Attempted to access index 3 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
