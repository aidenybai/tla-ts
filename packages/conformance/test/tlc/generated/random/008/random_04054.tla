(*---
description: Evaluates a random record expression, seed 262, number 4054.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04054 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Cardinality([b6382 \in 1..3 |-> 0]), b |-> ((SUBSET {1} = SUBSET {1}) /\ (TRUE = <<5, 6>>))] EXCEPT !.a = @ + (SelectSeq(<<7, 3>>, LAMBDA e : e > 0) + (LET b6383 == -1 IN b6383 % (0 % 2147483647)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    <<0, 0, 0>>
    2181:0 Attempted to compute cardinality of the value
    <<0, 0, 0>>
---*)
