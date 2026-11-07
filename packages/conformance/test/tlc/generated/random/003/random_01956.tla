(*---
description: Evaluates a random set expression, seed 262, number 1956.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01956 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({SortSeq((<<3, 1, 2>> \o <<1, 2>>), LAMBDA p, q : p < q) : b3080 \in DOMAIN [b3081 \in {x \in 1..3 : x > 1} |-> b3081]} \cap (DOMAIN [(1 :> 2) EXCEPT ![-1] = 2] \cap {(-1 * 3), LET b3082 == 3 IN 7})))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 152 to line 14, col 157 of module random_01956
    | {}
---*)
