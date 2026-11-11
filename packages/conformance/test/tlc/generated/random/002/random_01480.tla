(*---
description: Evaluates a random int expression, seed 262, number 1480.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01480 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality({b2364 \in {<<1, [x \in 1..2 |-> x]>>, ([a |-> 1, b |-> TRUE]).a} : (\A b2365 \in {b2366 \in {1} : TRUE} : ({2, 1, 3} \subseteq {x \in 1..3 : x > 1}))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01480 failed.
    Attempted to compare integer 1 with non-integer:
    <<1, <<1, 2>>>>
---*)
