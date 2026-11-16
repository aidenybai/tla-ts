(*---
description: Evaluates a random bool expression, seed 262, number 3901.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03901 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b6141 \in {(CHOOSE b6143 \in (SUBSET {1} \cap {2, 1, 3}) : (\A b6144 \in 2..1 : TRUE)) : b6142 \in ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 1] \ (7 < 1))} : (\E b6145 \in (DOMAIN [x \in Nat |-> x + 1] \ (b6141 .. b6141)) : (~(b6145 \in 1..3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03901 failed.
    Attempted to enumerate S \ T when S:
    [a |-> 2, b |-> TRUE]
    is not enumerable.
---*)
