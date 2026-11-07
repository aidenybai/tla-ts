(*---
description: Evaluates a random record expression, seed 262, number 6153.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06153 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (SubSeq((<<1, 2>> \o <<>>), Cardinality({2, 1, 3}), (-1 \div 0)) * ([b9464 \in {1} |-> b9464])[({1, 2} \ {1, 2})]), b |-> UNION {{LET b9466 == b9465 IN 7 : b9465 \in {b9467 \in SUBSET {1} : FALSE}}, UNION {{b9468 \in {} : TRUE}, (CHOOSE f \in [{1, 2} \ {1} -> {2, 1, 3}] : TRUE)}}])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
