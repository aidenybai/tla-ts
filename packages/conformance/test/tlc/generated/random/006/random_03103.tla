(*---
description: Evaluates a random int expression, seed 262, number 3103.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03103 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF LET b4953 == Cardinality(<<3, 1, 2>>) IN (-b4953) THEN IF (TRUE => FALSE) THEN (~FALSE) ELSE IF FALSE THEN 3 ELSE 7 ELSE (Head(<<>>) \div (-1 + 2147483647)) + ((Len(<<>>) % Cardinality(TRUE)) - LET b4954 == Head(<<1>>) IN Cardinality({1, 2}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    <<3, 1, 2>>
    2181:0 Attempted to compute cardinality of the value
    <<3, 1, 2>>
---*)
