(*---
description: Evaluates a random seq expression, seed 262, number 6206.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06206 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<{IF FALSE THEN 2147483647 ELSE 2, Head(<<1>>)}, Cardinality((2..1 \cup {2, 1, 3}))>> \o <<CASE ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]) -> Head(<<>>) [] OTHER -> (-1 + [a |-> 1, b |-> TRUE]), Len([<<1, 2>> EXCEPT ![1] = 2147483647])>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
