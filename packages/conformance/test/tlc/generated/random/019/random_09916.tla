(*---
description: Evaluates a random function expression, seed 262, number 9916.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09916 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{} -> {1, 2} \cap {2}] : TRUE) EXCEPT ![((IF TRUE THEN 0 ELSE [x \in Nat |-> x + 1] % Len(<<1>>)) * ((-2) % Cardinality(SUBSET {1})))] = (Cardinality(({} \cup {2, 1, 3})) * ([[a |-> 1] EXCEPT !.a = FALSE]).a)])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 18 to line 14, col 60 of module random_09916
    | <<>>
---*)
