(*---
description: Evaluates a random seq expression, seed 262, number 6260.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06260 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail(<<Len(<<>>), ([x \in 1..2 |-> x])[2]>>) \o <<(-(2147483647 \div 2147483647)), ((2 * 2147483647) % <<3, 3>>)>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2*2147483647
    2178:0 Overflow when computing 2*2147483647
---*)
