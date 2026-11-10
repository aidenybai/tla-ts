(*---
description: Evaluates a random record expression, seed 262, number 903.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00903 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> Head(<<1>>), b |-> (2 = -1)] EXCEPT !.a = @ + ((1 - 2147483647) * ([a |-> 1, b |-> TRUE]).a)] EXCEPT !.a = @ + (CHOOSE b1453 \in ((<<5, 6>>)[3] .. (3 % 2)) : (Cardinality([a |-> 1, b |-> TRUE]) = Head(<<1, 2>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00903 failed.
    Attempted to access index 3 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
