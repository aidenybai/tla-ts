(*---
description: Evaluates a random int expression, seed 262, number 6617.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06617 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((Cardinality([a |-> 1]) \div Len(<<3, 1, 2>>)) :> (([x \in 1..2 |-> x])[2147483647] + ([a |-> 1]).a)) EXCEPT ![((CHOOSE b10156 \in ({} \cup {2, 1, 3}) : ([a |-> 1] = [a |-> 1, b |-> TRUE])) - (Head(<<1>>) \div Head(<<1, 2>>)))] = (LET b10157 == Head(<<3, 1, 2>>) IN Cardinality({1, 2}) % Head(SubSeq(<<1>>, -1, 0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    [a |-> 1]
    2181:0 Attempted to compute cardinality of the value
    [a |-> 1]
---*)
