(*---
description: Evaluates a random bool expression, seed 262, number 8530.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08530 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({Head(<<b13217, 7>>) : b13217 \in ({b13218 \in {1} : TRUE} \cap UNION {{1, 2}, {}})} \subseteq ((Head(<<>>) .. (-1 * 1)) \ ((7 % 7) .. ([a |-> 1]).a))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
