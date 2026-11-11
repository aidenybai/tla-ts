(*---
description: Evaluates a random set expression, seed 262, number 3028.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03028 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b4812 \in ({([a |-> 1]).a : b4813 \in ({1} \cup SUBSET {1})} \ ((-1 % 7) .. Cardinality({x \in 1..3 : x > 1}))) : ((CASE FALSE -> b4812 [] OTHER -> b4812 * Len(<<>>)) \subseteq {IF TRUE THEN {1, 2} ELSE 2, IF FALSE THEN b4812 ELSE 7})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03028 failed.
    Attempted to compare the set {} with the value:
    1
---*)
