(*---
description: Evaluates a random seq expression, seed 262, number 9095.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09095 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0) \o (<<3, 1, 2>> \o <<>>)) \o Tail(Len(<<3, 1, 2>>))) \o Append(<<CASE FALSE -> 1 [] OTHER -> 2, (CHOOSE b14131 \in {1} : FALSE)>>, ([b14132 \in {x \in 1..3 : x > 1} |-> 0])[([x \in 1..2 |-> x])[0]])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Tail should be a sequence, but instead it is:
    3
    2283:0 The argument of Tail should be a sequence, but instead it is:
    3
---*)
