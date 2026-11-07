(*---
description: Evaluates a random int expression, seed 262, number 9148.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09148 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE ({1} = {1, 2}) -> IF FALSE THEN 2147483647 ELSE 1 [] OTHER -> IF TRUE THEN 0 ELSE -1 + (-CASE FALSE -> 2 [] OTHER -> FALSE)) % Len([Tail(<<>>) EXCEPT ![1] = LET b14212 == [a |-> 1] IN b14212])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
