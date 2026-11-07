(*---
description: Evaluates a random bool expression, seed 262, number 413.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00413 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({b676 : b676 \in {x \in 1..3 : x > 1}} \ (FALSE /\ FALSE)) \cap DOMAIN ([x \in Nat |-> x + 1] @@ [x \in Nat |-> x + 1])) \subseteq UNION {UNION {(7 .. 7), (2 .. 0)}, (({x \in 1..3 : x > 1} \ Nat) \cap DOMAIN (1 :> 2))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00413 failed.
    Attempted to check if the value:
    2
    is an element of the boolean FALSE
---*)
