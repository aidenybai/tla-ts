(*---
description: Evaluates a random seq expression, seed 262, number 3318.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03318 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq((SubSeq(([a |-> 1, b |-> TRUE] \o <<1>>), LET b5273 == -1 IN 1, Len({2, 1, 3})) \o [(1 % 7) EXCEPT ![1] = (2147483647 + 2147483647)]), CASE ((CHOOSE f \in [{1, 2} \cap {2} -> 2..1] : TRUE) = [b5274 \in {x \in 1..3 : x > 1} |-> b5274]) -> ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 0]).a [] OTHER -> Cardinality(DOMAIN [x \in 1..2 |-> x]), ((Cardinality(2..1) - Cardinality({x \in 1..3 : x > 1})) + (-CASE FALSE -> 2 [] OTHER -> 2147483647))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03318 failed.
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    [a |-> 1, b |-> TRUE]
---*)
