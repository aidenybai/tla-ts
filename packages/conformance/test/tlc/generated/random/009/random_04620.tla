(*---
description: Evaluates a random int expression, seed 262, number 4620.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04620 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (((2 \div 1) \div (2147483647 * 1)) \in DOMAIN ([x \in 1..2 |-> x] @@ {x \in 1..3 : x > 1})) -> (Head(Tail(<<>>)) * SelectSeq(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0), LAMBDA e : e > 0)) [] OTHER -> ((LET b7232 == -1 IN [a |-> 1] % (2 % 3)) % (Cardinality(2..1) * (0 \in {x \in 1..3 : x > 1}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04620 failed.
    2169:0 The second argument of @@ should be a function, but instead it is:
    {2, 3}
---*)
