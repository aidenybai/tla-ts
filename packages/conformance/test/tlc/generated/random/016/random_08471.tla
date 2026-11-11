(*---
description: Evaluates a random record expression, seed 262, number 8471.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08471 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (IF TRUE THEN -1 ELSE {x \in 1..3 : x > 1} \div LET b13106 == -1 IN b13106), b |-> (SelectSeq(<<1, 2>>, LAMBDA e : e > 0) = [<<5, 6>> EXCEPT ![7] = 1..3])] EXCEPT !.a = @ + Cardinality(UNION {DOMAIN <<5, 6>>, ({2, 1, 3} \cup {2, 1, 3})})])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 149 to line 14, col 156 of module random_08471
    | [a |-> 2, b |-> FALSE]
---*)
