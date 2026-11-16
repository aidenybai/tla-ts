(*---
description: Evaluates a random bool expression, seed 262, number 6860.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06860 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b10519 \in {b10520 \in ({0, 7} \ ([a |-> 1, b |-> TRUE] \ SUBSET {1})) : ((\A b10521 \in SUBSET {1} : TRUE) <=> (2 < 7))} : ((CHOOSE b10522 \in {b10519, b10519} : (TRUE /\ FALSE)) = Len([<<>> EXCEPT ![1] = 2147483647]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06860 failed.
    Attempted to check if element:
    0
    is in the record:
    [a |-> 1, b |-> TRUE]
---*)
