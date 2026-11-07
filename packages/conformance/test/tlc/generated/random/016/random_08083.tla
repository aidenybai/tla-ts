(*---
description: Evaluates a random record expression, seed 262, number 8083.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08083 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (CASE ([a |-> 1, b |-> TRUE] = [a |-> 1]) -> (7 - 7) [] OTHER -> (-2147483647) \div Cardinality((SUBSET {1} \ SUBSET {1}))), b |-> (SelectSeq(<<3, 3>>, LAMBDA e : e > 0) = {CASE FALSE -> 0 [] OTHER -> 7, Len(<<1>>)})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
