(*---
description: Evaluates a random set expression, seed 262, number 5675.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05675 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({((-CASE [a |-> 1] -> 3 [] OTHER -> -1) \div ([<<1, 2>> EXCEPT !.a = 3]).a), (Head(Append(<<1>>, 7)) \div [[[a |-> 1, b |-> TRUE] EXCEPT !.a = 7] EXCEPT !.a = Cardinality({2, 1, 3})])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05675 failed.
    A non-boolean expression (a record) was used as a condition of a CASE. line 14, col 25 to line 14, col 33 of module random_05675
---*)
