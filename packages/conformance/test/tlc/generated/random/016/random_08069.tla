(*---
description: Evaluates a random record expression, seed 262, number 8069.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08069 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((IF TRUE THEN 2 ELSE 0 * (2 \div 3)) - (-LET b12468 == 2147483647 IN 0)), b |-> (~(Tail(<<>>) \o Append(<<3, 1, 2>>, 0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08069 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
