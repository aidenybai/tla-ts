(*---
description: Evaluates a random bool expression, seed 262, number 9274.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09274 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append({b14399 \in (1 .. 7) : (TRUE \/ SUBSET {1})}, (IF TRUE THEN 2 ELSE 0 \in (2..1 \cap {}))) = (CHOOSE f \in [{1} -> {1}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09274 failed.
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {1, 2, 3, 4, 5, 6, 7}
---*)
