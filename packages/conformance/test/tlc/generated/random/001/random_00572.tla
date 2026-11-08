(*---
description: Evaluates a random record expression, seed 262, number 572.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00572 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (((-2) % (2 + -1)) % (Len(<<3, 1, 2>>) * (2147483647 \div 1))), b |-> (([a |-> 1, b |-> FALSE]).a <=> (~(\A b970 \in {x \in 1..3 : x > 1} : FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00572 failed.
    2178:0 Overflow when computing 3*2147483647
---*)
