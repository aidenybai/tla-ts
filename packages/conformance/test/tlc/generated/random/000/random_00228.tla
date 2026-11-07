(*---
description: Evaluates a random record expression, seed 262, number 228.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00228 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ((2147483647 % 3) * ([a |-> 1]).a), b |-> (~([a |-> 1, b |-> TRUE] = [a |-> 1]))] EXCEPT !.a = @ + (-(CHOOSE b374 \in ({1} \cap <<5, 6>>) : (b374 \in SUBSET {1})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00228 failed.
    Attempted to check set membership in a tuple value.
---*)
