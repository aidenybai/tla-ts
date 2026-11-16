(*---
description: Evaluates a random bool expression, seed 262, number 5563.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05563 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((SortSeq([<<1, 2>> EXCEPT ![1] = 1], LAMBDA p, q : p < q) = (CHOOSE f \in [{1, 2} \ {1} -> {1, 2} \ {1}] : TRUE)) /\ ([{b8614 : b8614 \in {}} EXCEPT !.a = @ + (-3)] = [[[a |-> 1] EXCEPT !.a = 3] EXCEPT !.a = DOMAIN [x \in 1..2 |-> x]])))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
