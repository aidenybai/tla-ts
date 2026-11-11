(*---
description: Evaluates a random bool expression, seed 262, number 549.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00549 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE f \in [{} -> {0} \cup {1}] : TRUE) => ((3 - -1) = (-3))) => (\A b933 \in ([a |-> 0, b |-> TRUE] .. IF FALSE THEN 7 ELSE -1) : ((2147483647 < b933) <=> (2..1 \subseteq {x \in 1..3 : x > 1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00549 failed.
    Attempted to evaluate an expression of form P => Q when P was
    a function  of the form (d1 :> e1 @@ ... @@ dN :> eN).
    line 14, col 18 to line 14, col 80 of module random_00549
---*)
