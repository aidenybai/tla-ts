(*---
description: Evaluates a random function expression, seed 262, number 9869.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09869 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([b15328 \in [TRUE EXCEPT ![7] = 3] |-> (CHOOSE b15329 \in Nat : TRUE)] @@ [b15330 \in ({1} \cap Nat) |-> (TRUE * b15330)]) @@ [b15331 \in ({-1 : b15332 \in 1..3} \cup ({x \in 1..3 : x > 1} \ 2..1)) |-> (CASE TRUE -> b15331 [] OTHER -> 0 * ([x \in 1..2 |-> x])[b15331])]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09869 failed.
    Attempted to apply EXCEPT construct to the value TRUE.
---*)
