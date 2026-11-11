(*---
description: Evaluates a random int expression, seed 262, number 1952.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01952 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b3075 \in (DOMAIN (0 - 2) \ ((SUBSET {1} \cap {1}) \cap (Nat \ {1, 2}))) : ((-CASE TRUE -> b3075 [] OTHER -> TRUE) \in ((Nat \cap [a |-> 1, b |-> TRUE]) \ {<<1>> : b3076 \in Nat}))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01952 failed.
    Attempted to apply the operator DOMAIN to a non-function
    (an integer)
    line 14, col 28 to line 14, col 41 of module random_01952
---*)
