(*---
description: Evaluates a random record expression, seed 262, number 6035.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06035 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (Len(SelectSeq(<<1, 2>>, LAMBDA e : e > 0)) - ((TRUE <=> FALSE) - (3 * 2147483647))), b |-> (((FALSE => FALSE) <=> (\E b9295 \in {x \in 1..3 : x > 1} : FALSE)) \/ (\A b9296 \in (FALSE <=> TRUE) : (\E b9297 \in {1} : TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06035 failed.
    2178:0 Overflow when computing 3*2147483647
---*)
