(*---
description: Evaluates a random bool expression, seed 262, number 8143.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08143 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> LET b12590 == Head(<<>>) IN (b12590 + 7), b |-> (<<2147483647, 3>> = [a |-> (1 :> 2), b |-> TRUE])] = [[a |-> (<<1, 2>> \div 1), b |-> (\A b12591 \in {} : TRUE)] EXCEPT !.a = @ + ((2147483647 % 2147483647) \div IF FALSE THEN 3 ELSE 0)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
