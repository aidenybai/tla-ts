(*---
description: Evaluates a random bool expression, seed 262, number 2999.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02999 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(\A b4763 \in {b4764 \in ({x \in 1..3 : x > 1} \cap [a |-> 1]) : (FALSE <=> TRUE)} : (\E b4765 \in {b4763, b4763} : (-1 < [x \in 1..2 |-> x])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02999 failed.
    Attempted to check if element:
    2
    is in the record:
    [a |-> 1]
---*)
