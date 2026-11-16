(*---
description: Evaluates a random bool expression, seed 262, number 1057.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01057 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE (\E b1690 \in {b1691 \in {1, 2} : TRUE} : (<<>> = -1)) -> (IF TRUE THEN -1 ELSE 2 * Cardinality({1})) [] OTHER -> ((-1) * IF FALSE THEN 2 ELSE 0) = (DOMAIN (CHOOSE f \in [{1, 2} \cap {2} -> {1}] : TRUE) \ {(CHOOSE b1693 \in SUBSET {1} : TRUE) : b1692 \in UNION {{x \in 1..3 : x > 1}, {x \in 1..3 : x > 1}}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01057 failed.
    Attempted to check equality of the function <<>> with the value:
    -1
---*)
