(*---
description: Evaluates a random function expression, seed 262, number 7812.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07812 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{1, 2} -> {1, 2} \cap {2}] : TRUE) @@ ({(3 - b12055) : b12055 \in (2..1 = Nat)} :> ((-7) + IF TRUE THEN 7 ELSE 7))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07812 failed.
    Attempted to check equality of the set {} with the value:
    Nat
---*)
