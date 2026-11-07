(*---
description: Evaluates a random record expression, seed 262, number 1016.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01016 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({((CHOOSE b1634 \in {} : TRUE) + IF TRUE THEN 2 ELSE 2147483647) : b1633 \in DOMAIN (0 @@ 1)} \ ({(CHOOSE b1636 \in {x \in 1..3 : x > 1} : TRUE) : b1635 \in {1, 7}} \cap UNION {UNION {[a |-> 1], Nat}, {b1637 \in {1, 2} : TRUE}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    0
    2169:0 The first argument of @@ should be a function, but instead it is:
    0
---*)
