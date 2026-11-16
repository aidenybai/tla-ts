(*---
description: Evaluates a random int expression, seed 262, number 9712.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09712 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b15071 == ((CHOOSE b15072 \in {-1, 1} : ([a |-> 1] <=> (1 :> 2))) :> ((2 * 0) - Cardinality(TRUE))) IN (((CHOOSE b15073 \in {1, 2} : TRUE) * CASE 7 -> 7 [] OTHER -> -1) - ((b15071 + 7) % ([a |-> 1]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09712 failed.
    A non-boolean expression (an integer) was used as a condition of a CASE. 7
---*)
