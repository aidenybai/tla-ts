(*---
description: Evaluates a random set expression, seed 262, number 3215.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03215 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b5106 \in {IF (FALSE /\ TRUE) THEN IF FALSE THEN <<1>> ELSE 1 ELSE Head(<<1>>), Len(<<2, 2147483647>>)} : ((Cardinality(SUBSET {1}) * Cardinality([a |-> 1, b |-> TRUE])) :> (CASE FALSE -> 2 [] OTHER -> b5106 % ([x \in Nat |-> x + 1])[b5106]))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03215 failed.
    2181:0 Attempted to compute cardinality of the value
    [a |-> 1, b |-> TRUE]
---*)
