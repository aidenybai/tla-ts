(*---
description: Evaluates a random set expression, seed 262, number 5594.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05594 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((DOMAIN <<5, 6>> \cap (1 .. 0)) \cup ((7 .. 2147483647) \cap UNION {Nat, {1}})) \cap {b8662 \in DOMAIN [b8663 \in <<5, 6>> |-> 2147483647] : ({b8662, 2147483647} = ({2, 1, 3} \cup Nat))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05594 failed.
    Attempted to compare the set {1} with the value:
    Nat
---*)
