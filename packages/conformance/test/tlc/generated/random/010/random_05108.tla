(*---
description: Evaluates a random seq expression, seed 262, number 5108.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05108 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([<<3, 1, 2>> EXCEPT ![1] = 1] \o [<<3, 1, 2>> EXCEPT ![1] = 2147483647]) \o Tail(Tail(<<1>>))) \o <<CASE (FALSE /\ TRUE) -> IF FALSE THEN 3 ELSE 2 [] OTHER -> (CHOOSE b7945 \in {x \in 1..3 : x > 1} : FALSE), Cardinality(SelectSeq(<<>>, LAMBDA e : e > 0))>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05108 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
