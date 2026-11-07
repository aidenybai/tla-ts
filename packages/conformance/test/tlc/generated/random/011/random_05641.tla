(*---
description: Evaluates a random set expression, seed 262, number 5641.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05641 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {UNION {({b8714 \in {2, 1, 3} : FALSE} \cap {1 : b8715 \in {1}}), {Cardinality({2, 1, 3}), (7 * 3)}}, {Cardinality((TRUE /\ TRUE)), CASE (0 < 1) -> (7 - 3) [] OTHER -> ((1 :> 2))[-1]}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    TRUE
    2181:0 Attempted to compute cardinality of the value
    TRUE
---*)
