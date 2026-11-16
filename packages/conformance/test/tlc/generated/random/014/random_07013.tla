(*---
description: Evaluates a random bool expression, seed 262, number 7013.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07013 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b10751 \in ({CASE {2, 1, 3} -> 7 [] OTHER -> 0 : b10752 \in UNION {2..1, FALSE}} \cap ({b10753 : b10753 \in 1..3} \cap DOMAIN [x \in 1..2 |-> x])) : ((\A b10754 \in {b10755 : b10755 \in 1..3} : (\A b10756 \in {1, 2} : TRUE)) \/ ([[a |-> 1] EXCEPT !.a = b10751] \in {-1 : b10757 \in SUBSET {1}}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07013 failed.
    Attempted to compare boolean FALSE with non-boolean:
    {}
---*)
