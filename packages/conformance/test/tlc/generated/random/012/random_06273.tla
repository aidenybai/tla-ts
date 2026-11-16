(*---
description: Evaluates a random int expression, seed 262, number 6273.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06273 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality(({2147483647, 2147483647} \cap UNION {Nat, {}})) + (((<<5, 6>>)[-1] % ([x \in 1..2 |-> x])[1]) * ((CHOOSE b9655 \in SUBSET {1} : TRUE) % IF FALSE THEN 0 ELSE -1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06273 failed.
    Attempted to compare the set {} with the value:
    Nat
---*)
