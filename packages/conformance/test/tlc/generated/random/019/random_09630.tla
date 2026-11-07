(*---
description: Evaluates a random function expression, seed 262, number 9630.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09630 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b14950 \in {((7 \div 0) % (7 - <<5, 6>>)), Head(SortSeq(<<>>, LAMBDA p, q : p < q))} |-> IF (DOMAIN [x \in 1..2 |-> x] = {7 : b14951 \in 2..1}) THEN ((0 + [a |-> 1]) \div Head(<<1, 2>>)) ELSE (Head(<<3, 1, 2>>) - (7 % b14950))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
