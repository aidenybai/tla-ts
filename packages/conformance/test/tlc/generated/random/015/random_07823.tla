(*---
description: Evaluates a random bool expression, seed 262, number 7823.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07823 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE r \in [a : {1}] : TRUE) = (CHOOSE r \in [a : {0} \cup {1}] : TRUE)) <=> (Head(<<>>) < (2147483647 - 0))) => (\E b12075 \in ((SUBSET {1} \cup 2..1) \cap {b12076 : b12076 \in 1..3}) : (LET b12077 == b12075 IN 2 - (CHOOSE b12078 \in 2..1 : FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
