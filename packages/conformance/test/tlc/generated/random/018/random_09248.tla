(*---
description: Evaluates a random seq expression, seed 262, number 9248.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09248 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([Tail((<<1>> \o <<1>>)) EXCEPT ![1] = (([a |-> 1]).a * IF TRUE THEN 0 ELSE 3)], Head(SubSeq(Tail(<<1, 2>>), IF TRUE THEN -1 ELSE 2147483647, Head(<<>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
