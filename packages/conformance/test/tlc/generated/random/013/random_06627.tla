(*---
description: Evaluates a random int expression, seed 262, number 6627.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06627 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((UNION {DOMAIN (1 :> 2), UNION {{1, 2}, {}}} \subseteq [[a |-> 0, b |-> TRUE] EXCEPT !.a = Append(<<>>, 2147483647)]) - (((CHOOSE b10177 \in {2, 1, 3} : 2147483647) - Cardinality(SUBSET {1}))).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06627 failed.
    Attempted to check if element:
    1
    is in the record:
    [a |-> <<2147483647>>, b |-> TRUE]
---*)
