(*---
description: Evaluates a random int expression, seed 262, number 9312.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09312 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF (\A b14449 \in (1..3 \cup SUBSET {1}) : (TRUE /\ FALSE)) THEN ((<<1>> = (1 :> 2)) = Len(<<1>>)) ELSE ((CHOOSE b14450 \in {1, 2} : TRUE) - (3 % 7)) - ((Head(<<1, 2>>) % (TRUE)[2]) + CASE ({1, 2} \subseteq Nat) -> (TRUE \/ TRUE) [] OTHER -> LET b14451 == 0 IN b14451)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09312 failed.
    Attempted to compare the set {} with the value:
    2
---*)
