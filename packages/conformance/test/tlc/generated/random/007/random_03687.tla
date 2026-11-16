(*---
description: Evaluates a random bool expression, seed 262, number 3687.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03687 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF ([a |-> 1] = <<1>>) THEN ([a |-> 1, b |-> TRUE]).a ELSE ([x \in 1..2 |-> x])[2147483647] % ((1 + 2147483647) % ([x \in Nat |-> x + 1])[-1])) \in ((Head(<<3, 1, 2>>) .. Cardinality({2, 1, 3})) \ ({b5822 \in Nat : FALSE} \cap ({x \in 1..3 : x > 1} \ {x \in 1..3 : x > 1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03687 failed.
    Attempted to check equality of record:
    [a |-> 1]
    with non-record
    <<1>>
---*)
