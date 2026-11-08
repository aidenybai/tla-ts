(*---
description: Evaluates a random function expression, seed 262, number 7731.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07731 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(Append((CHOOSE f \in [{0} \cup {1} -> {1, 2}] : TRUE), IF TRUE THEN 2147483647 ELSE 7)) :> Cardinality({b11924 \in {1, 0} : (SUBSET {1} \subseteq {2, 1, 3})})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07731 failed.
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    (0 :> 1 @@ 1 :> 1)
---*)
