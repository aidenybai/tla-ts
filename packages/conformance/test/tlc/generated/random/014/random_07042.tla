(*---
description: Evaluates a random function expression, seed 262, number 7042.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07042 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b10799 \in ([a |-> (2147483647 \div 0), b |-> (FALSE \/ FALSE)] = (Head(<<3, 1, 2>>) \div Cardinality({1, 2}))) |-> ([a |-> (\A b10800 \in {x \in 1..3 : x > 1} : TRUE), b |-> ({1} = SUBSET {1})]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
