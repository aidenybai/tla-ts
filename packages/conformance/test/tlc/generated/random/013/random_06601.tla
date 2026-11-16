(*---
description: Evaluates a random record expression, seed 262, number 6601.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06601 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[<<([a |-> 1]).a, SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)>> EXCEPT !.a = Len(SubSeq(<<1, 2>>, [a |-> 1], 0))] EXCEPT !.a = @ + (Cardinality(DOMAIN (1 :> 2)) \div SortSeq(Append(<<3, 1, 2>>, 3), LAMBDA p, q : p < q))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06601 failed.
    Attempted to access tuple at a non integral index: "a"
---*)
