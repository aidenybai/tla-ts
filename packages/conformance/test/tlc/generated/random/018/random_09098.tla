(*---
description: Evaluates a random seq expression, seed 262, number 9098.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09098 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Tail(Tail(<<>>)) \o Tail(<<7, TRUE>>)) \o Append(LET b14133 == CASE FALSE -> -1 [] OTHER -> 1 IN LET b14134 == 1 IN b14134, (Cardinality({2, 1, 3}) - (7 \div 7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
