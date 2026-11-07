(*---
description: Evaluates a random function expression, seed 262, number 353.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00353 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[Tail(Tail(1)) EXCEPT ![Head(SortSeq(<<1>>, LAMBDA p, q : p < q))] = ((7 - 2147483647) \div (FALSE => TRUE))] EXCEPT ![IF ((1 < [a |-> 1]) \/ <<-1, -1>>) THEN ([(1 :> 2) EXCEPT ![0] = <<1, 2>>])[(0 * <<3, 1, 2>>)] ELSE ((-2147483647) * (0 - 0))] = Cardinality((IF TRUE THEN <<>> ELSE 2 .. Cardinality({})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Tail should be a sequence, but instead it is:
    1
    2283:0 The argument of Tail should be a sequence, but instead it is:
    1
---*)
