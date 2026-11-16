(*---
description: Evaluates a random seq expression, seed 262, number 3931.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03931 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(SelectSeq(<<3, 3>>, LAMBDA e : e > 0), ((1 % 1) \div Head([a |-> 1]))) \o [CASE (<<1>> \/ [a |-> 1]) -> (2 % 2147483647) [] OTHER -> (0 \div 2) EXCEPT ![1] = ([b6195 \in {x \in 1..3 : x > 1} |-> 3])[IF 7 THEN 7 ELSE 2147483647]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03931 failed.
    2283:0 The argument of Head should be a sequence, but instead it is:
    [a |-> 1]
---*)
