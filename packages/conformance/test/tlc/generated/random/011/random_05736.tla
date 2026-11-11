(*---
description: Evaluates a random record expression, seed 262, number 5736.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05736 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(\E b8834 \in ({FALSE, 2} \ {b8835 \in 1..3 : FALSE}) : (<<3, b8834>> = (b8834 :> b8834))) EXCEPT !.a = @ + (CHOOSE b8836 \in [[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 1] EXCEPT !.a = LET b8837 == -1 IN b8837] : (\A b8838 \in {b8836 : b8839 \in {1, 2}} : (FALSE /\ FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05736 failed.
    Attempted to compare integer 2 with non-integer:
    FALSE
---*)
