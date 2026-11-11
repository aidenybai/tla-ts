(*---
description: Evaluates a random record expression, seed 262, number 6970.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06970 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1, b |-> TRUE] EXCEPT !.a = 1] EXCEPT !.a = @ + Cardinality([a |-> 1])] EXCEPT !.a = ((2 * 3) - ([x \in Nat |-> x + 1])[1])] EXCEPT !.a = @ + CASE ((2 < 3) <=> (TRUE => TRUE)) -> ([<<5, 6>> EXCEPT ![2147483647] = -1])[LET b10662 == -1 IN 3] [] OTHER -> ((7)[3] % (-1))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06970 failed.
    2181:0 Attempted to compute cardinality of the value
    [a |-> 1]
---*)
