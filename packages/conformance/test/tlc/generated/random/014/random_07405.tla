(*---
description: Evaluates a random bool expression, seed 262, number 7405.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07405 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b11408 == (2147483647 - 2147483647) IN (0 \div b11408) .. (CHOOSE b11409 \in ({2, 1, 3} \ 2..1) : (~FALSE))) \subseteq {(CHOOSE b11410 \in {0, 1} : (TRUE /\ FALSE)), (([a |-> 1, b |-> TRUE]).a % Cardinality(<<>>))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
