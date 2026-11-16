(*---
description: Evaluates a random function expression, seed 262, number 1299.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01299 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b2066 \in ({IF FALSE THEN -1 ELSE 3, Cardinality(SUBSET {1})} \cup UNION {([x \in Nat |-> x + 1])[-1], UNION {{x \in 1..3 : x > 1}, 1..3}}) |-> Cardinality({(b2066 \div <<>>), Head(<<3, 1, 2>>)})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01299 failed.
    In applying the function
    [x \in Nat |-> <expression line 14, col 107 to line 14, col 111 of module random_01299>],
    the first argument is:
    -1
    which is not in its domain.
---*)
