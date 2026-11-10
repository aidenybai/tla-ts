(*---
description: Evaluates a random set expression, seed 262, number 3079.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03079 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((UNION {({} \cup {1}), (-1 .. -1)} \cap DOMAIN [[x \in 1..2 |-> x] EXCEPT ![2] = 1]) \cup {([[x \in 1..2 |-> x] EXCEPT ![b4894] = b4894])[(1 :> 0)] : b4894 \in UNION {({1, 2} \cup Nat), ({x \in 1..3 : x > 1} \cap {1})}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03079 failed.
    Attempted to enumerate S \cup T when S:
    {1, 2}
    and T:
    Nat
    are not both enumerable
---*)
