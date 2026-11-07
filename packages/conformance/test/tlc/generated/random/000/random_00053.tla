(*---
description: Evaluates a random set expression, seed 262, number 53.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00053 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b77 \in {Cardinality(DOMAIN [x \in 1..2 |-> x]) : b78 \in ((1 \div 0) .. LET b79 == 2 IN b79)} : ((CASE TRUE -> b77 [] OTHER -> 0 < (1 + b77)) /\ (UNION {{}, <<>>} = SortSeq(<<1>>, LAMBDA p, q : p < q)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
