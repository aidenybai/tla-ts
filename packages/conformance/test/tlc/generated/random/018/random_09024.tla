(*---
description: Evaluates a random seq expression, seed 262, number 9024.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09024 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b14014 == Head(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)) IN (Tail(<<>>) - (2 - 2147483647)) \div LET b14015 == ((CHOOSE b14016 \in 1..3 : [a |-> 1, b |-> TRUE]) % CASE TRUE -> 0 [] OTHER -> 2147483647) IN (Head(<<3, 1, 2>>) % ([x \in Nat |-> x + 1])[b14015])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09024 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
