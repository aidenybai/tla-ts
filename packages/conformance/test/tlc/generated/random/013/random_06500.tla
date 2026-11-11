(*---
description: Evaluates a random function expression, seed 262, number 6500.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06500 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((0 - 3) % (CHOOSE b9994 \in {1} : TRUE)) \div ([<<5, 6>> EXCEPT ![2] = 1])[([x \in Nat |-> x + 1])[3]]) :> LET b9995 == ((7 % 2147483647) + Cardinality({})) IN (-LET b9996 == 7 IN b9995)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06500 failed.
    Attempted to access index 4 of tuple
    <<5, 1>>
    which is out of bounds.
---*)
