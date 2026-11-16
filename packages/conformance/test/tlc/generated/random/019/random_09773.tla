(*---
description: Evaluates a random set expression, seed 262, number 9773.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09773 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([{x \in 1..3 : x > 1} EXCEPT !.a = 1] \cap {7 : b15169 \in {1, 2}}) \cup (DOMAIN [x \in Nat |-> x + 1] \cup UNION {Nat, 2..1})) \subseteq ({(CHOOSE b15171 \in 1..3 : TRUE) : b15170 \in (CHOOSE f \in [2..1 -> {}] : TRUE)} \cup DOMAIN ([a |-> 1, b |-> TRUE] :> 7))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09773 failed.
    Attempted to apply EXCEPT construct to the value {2, 3}.
---*)
