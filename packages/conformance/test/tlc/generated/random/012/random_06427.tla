(*---
description: Evaluates a random seq expression, seed 262, number 6427.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06427 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SubSeq(SubSeq((<<1, 2>> \o <<1>>), (CHOOSE b9893 \in {} : [x \in 1..2 |-> x]), ((1 :> 2))[1]), CASE (\A b9894 \in {2, 1, 3} : FALSE) -> Cardinality({}) [] OTHER -> CASE FALSE -> 2 [] OTHER -> 3, Cardinality((1..3 \cup {x \in 1..3 : x > 1}))), CASE ((TRUE /\ TRUE) /\ (~<<>>)) -> (SubSeq(<<1>>, 0, 2147483647) \o [<<1, 2>> EXCEPT ![1] = 2]) [] OTHER -> (IF TRUE THEN 0 ELSE 0 - [[a |-> 1] EXCEPT !.a = -1])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06427 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 59 to line 14, col 98 of module random_06427
---*)
