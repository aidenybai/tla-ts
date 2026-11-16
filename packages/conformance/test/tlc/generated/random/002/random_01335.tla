(*---
description: Evaluates a random record expression, seed 262, number 1335.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01335 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> Cardinality([a |-> 1]), b |-> ({1, 2} \subseteq {x \in 1..3 : x > 1})] EXCEPT !.a = @ + [[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647] EXCEPT !.a = @ + CASE TRUE -> 7 [] OTHER -> 0]] EXCEPT !.a = (((CHOOSE b2136 \in 2..1 : TRUE) % Len(<<>>)) - (-IF TRUE THEN 2147483647 ELSE 7))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01335 failed.
    2181:0 Attempted to compute cardinality of the value
    [a |-> 1]
---*)
