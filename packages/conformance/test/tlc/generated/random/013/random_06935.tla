(*---
description: Evaluates a random int expression, seed 262, number 6935.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06935 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF (IF FALSE THEN -1 ELSE 1 < (0 % 1)) THEN UNION {({x \in 1..3 : x > 1} \cap {}), ({1} \cap 2..1)} ELSE (<<-1, 2147483647>> \o Append(<<>>, 2147483647)) \div (-IF (\E b10616 \in {2, 1, 3} : TRUE) THEN (7 % 0) ELSE (2 \div 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
