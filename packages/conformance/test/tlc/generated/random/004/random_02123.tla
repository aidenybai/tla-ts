(*---
description: Evaluates a random bool expression, seed 262, number 2123.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02123 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({([<<5, 6>> EXCEPT ![1] = 7])[(1 \div 3)], (CHOOSE b3366 \in (1..3 \ Nat) : (b3366 \in Nat))} = (({b3367 : b3367 \in {1, 2}} \cup (1 .. 1)) \ DOMAIN ([x \in Nat |-> x + 1] @@ [x \in Nat |-> x + 1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02123 failed.
    Attempted to access index 0 of tuple
    <<7, 6>>
    which is out of bounds.
---*)
