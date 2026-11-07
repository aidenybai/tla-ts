(*---
description: Evaluates a random bool expression, seed 262, number 2735.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02735 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((IF TRUE THEN -1 ELSE 0 * LET b4316 == 2 IN 2147483647) .. Head((<<>> \o 2147483647))) \subseteq (({b4317 : b4317 \in {1}} \cap ({} \cap {2, 1, 3})) \cup {(3 * b4318) : b4318 \in (SUBSET {1} \cup 1..3)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    2147483647
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    2147483647
---*)
