(*---
description: Evaluates a random record expression, seed 262, number 6900.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06900 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> Head([a |-> 1]), b |-> (<<1, 2>> = [x \in Nat |-> x + 1])] EXCEPT !.a = @ + [b10568 \in (SUBSET {1} \cup {}) |-> CASE TRUE -> b10568 [] OTHER -> 2]] EXCEPT !.a = (Len(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)) \div ((2147483647 - 2147483647) \div Head(<<1>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06900 failed.
    2283:0 The argument of Head should be a sequence, but instead it is:
    [a |-> 1]
---*)
