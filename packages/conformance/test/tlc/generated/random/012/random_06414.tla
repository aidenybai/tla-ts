(*---
description: Evaluates a random function expression, seed 262, number 6414.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06414 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b9873 \in UNION {(Nat \cap Nat), {7, 2}} |-> (LET b9874 == [a |-> 1, b |-> TRUE] IN 3 * (3 * 3))] EXCEPT ![(((-2147483647) + (2 % 7)) * IF (1 < 1) THEN Cardinality(FALSE) ELSE Head(<<>>))] = Head(SubSeq(SubSeq(<<>>, 3, 0), (3 + 2), (CHOOSE b9875 \in 1..3 : TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
