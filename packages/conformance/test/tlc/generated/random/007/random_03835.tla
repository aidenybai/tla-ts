(*---
description: Evaluates a random record expression, seed 262, number 3835.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03835 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ((<<5, 6>>)[0] \div Head(<<1, 2>>)), b |-> ((\A b6042 \in {x \in 1..3 : x > 1} : FALSE) /\ (TRUE => FALSE))] EXCEPT !.a = (LET b6043 == (-1 % -1) IN (-2147483647) \div ((CHOOSE b6044 \in 1..3 : FALSE) * (CHOOSE b6045 \in 1..3 : FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03835 failed.
    Attempted to access index 0 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
