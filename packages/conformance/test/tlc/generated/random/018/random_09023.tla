(*---
description: Evaluates a random bool expression, seed 262, number 9023.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09023 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((~((\A b14012 \in {2, 1, 3} : FALSE) \/ (2..1 = SUBSET {1}))) <=> ({b14013 \in ({x \in 1..3 : x > 1} \cap SUBSET {1}) : (TRUE /\ FALSE)} \subseteq (UNION {(1 :> 2), Nat} \ UNION {{}, {}}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09023 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
