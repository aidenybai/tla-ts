(*---
description: Evaluates a random int expression, seed 262, number 5377.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05377 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b8312 == (((7 - 7) + (-Nat)) + ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 1]).a) IN (((0 :> [a |-> 1, b |-> TRUE]))[(CHOOSE f \in [{2, 1, 3} -> {1, 2} \ {1}] : TRUE)] \div ((CHOOSE b8313 \in {} : TRUE) % (b8312 \div b8312))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05377 failed.
    Attempted to check equality of integer 0 with non-integer:
    <<2, 2, 2>>
---*)
