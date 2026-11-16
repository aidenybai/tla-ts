(*---
description: Evaluates a random function expression, seed 262, number 559.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00559 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b947 \in ((({1} \cap Nat) \cup (3 .. -1)) \ DOMAIN [<<5, 6>> EXCEPT ![<<3, 1, 2>>] = Nat]) |-> ((CHOOSE r \in [a : 2..1] : TRUE)).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00559 failed.
    Attempted to access tuple at a non integral index: <<3, 1, 2>>
---*)
