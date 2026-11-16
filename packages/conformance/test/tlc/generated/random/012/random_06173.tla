(*---
description: Evaluates a random bool expression, seed 262, number 6173.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06173 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(CHOOSE b9493 \in {b9494 \in {1} : TRUE} : (b9493 \in TRUE)) : b9492 \in UNION {DOMAIN [x \in 1..2 |-> x], (0 .. 1)}} \subseteq {([[x \in Nat |-> x + 1] EXCEPT ![1] = b9495])[((1 :> 2))[b9495]] : b9495 \in ({b9496 \in SUBSET {1} : TRUE} \ UNION {{1}, {}})}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06173 failed.
    Attempted to check if the value:
    1
    is an element of the boolean TRUE
---*)
