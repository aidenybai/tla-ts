(*---
description: Evaluates a random bool expression, seed 262, number 7426.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07426 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b11443 \in DOMAIN [<<5, 6>> EXCEPT ![2] = 3] : (\E b11444 \in ({2, 1, 3} \cap [a |-> 1]) : (TRUE => TRUE))) = ([a |-> Cardinality({2, 1, 3}), b |-> ({} = Nat)]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07426 failed.
    Attempted to check if element:
    2
    is in the record:
    [a |-> 1]
---*)
