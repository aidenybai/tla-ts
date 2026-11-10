(*---
description: Evaluates a random set expression, seed 262, number 1887.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01887 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {((Head(<<>>) % (-1)) .. ((-7) .. (7 + 3))), {Head(Append(<<1>>, -1)), ((7 % 7) \div ([x \in Nat |-> x + 1])[1])}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01887 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
