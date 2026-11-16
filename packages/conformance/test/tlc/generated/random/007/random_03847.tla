(*---
description: Evaluates a random set expression, seed 262, number 3847.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03847 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({IF (\A b6060 \in (0 :> 1) : (SUBSET {1} \subseteq 1..3)) THEN Cardinality({7, 1}) ELSE Cardinality(UNION {Nat, 2..1}), Cardinality(((2 - -1) .. IF FALSE THEN 2 ELSE 0))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03847 failed.
    TLC encountered a non-enumerable quantifier bound
    (0 :> 1).
    line 14, col 35 to line 14, col 40 of module random_03847
---*)
