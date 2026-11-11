(*---
description: Evaluates a random set expression, seed 262, number 75.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00075 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {DOMAIN (\E b111 \in ({x \in 1..3 : x > 1} \ <<1, 2>>) : (TRUE /\ FALSE)), ((CHOOSE r \in [a : 2..1] : TRUE) .. LET b112 == LET b113 == 1 IN b113 IN Cardinality(1..3))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00075 failed.
    Attempted to check set membership in a tuple value.
---*)
