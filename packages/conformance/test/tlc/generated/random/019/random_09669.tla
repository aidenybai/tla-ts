(*---
description: Evaluates a random bool expression, seed 262, number 9669.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09669 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF (Head(<<1, 2>>) < Cardinality(1..3)) THEN Cardinality(({x \in 1..3 : x > 1} \cup {x \in 1..3 : x > 1})) ELSE (CHOOSE b15006 \in DOMAIN [x \in 1..2 |-> x] : (SUBSET {1} = [x \in Nat |-> x + 1])) = (LET b15007 == ([a |-> 1]).a IN (<<1>>)[2147483647] \div (LET b15008 == 0 IN 2147483647 + (CHOOSE f \in [{1, 2} \ {1} -> {}] : TRUE)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
