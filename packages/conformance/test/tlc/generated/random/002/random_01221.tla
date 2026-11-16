(*---
description: Evaluates a random bool expression, seed 262, number 1221.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01221 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((FALSE <=> TRUE) /\ (FALSE /\ TRUE)) /\ (SelectSeq(<<>>, LAMBDA e : e > 0) = (3 :> 2147483647))) = {IF (\E b1959 \in 2..1 : FALSE) THEN CASE FALSE -> 0 [] OTHER -> -1 ELSE IF TRUE THEN 1 ELSE 3, ((3 \div 2147483647) - Cardinality({x \in 1..3 : x > 1}))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01221 failed.
    Attempted to compare equality of boolean FALSE with non-boolean:
    {-2, 1}
---*)
