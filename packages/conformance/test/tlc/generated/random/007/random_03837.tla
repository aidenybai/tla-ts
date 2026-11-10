(*---
description: Evaluates a random int expression, seed 262, number 3837.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03837 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(SubSeq(<<CASE TRUE -> 2147483647 [] OTHER -> 2, CASE FALSE -> -1 [] OTHER -> 0>>, LET b6046 == Cardinality({}) IN ([x \in Nat |-> x + 1])[b6046], IF (FALSE = [x \in Nat |-> x + 1]) THEN ([a |-> 1]).a ELSE Head(<<1>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03837 failed.
    Attempted to compare equality of boolean FALSE with non-boolean:
    [x \in Nat |-> <expression line 14, col 194 to line 14, col 198 of module random_03837>]
---*)
