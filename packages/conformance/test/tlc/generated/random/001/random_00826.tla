(*---
description: Evaluates a random record expression, seed 262, number 826.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00826 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (((3 - -1) % (7 \div 0)) \div LET b1348 == Head(<<>>) IN Len(<<1>>)), b |-> ((\A b1349 \in UNION {SUBSET {1}, {1}} : (b1349 = b1349)) => ({b1350 : b1350 \in {1}} = ([a |-> 1] .. 2)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
