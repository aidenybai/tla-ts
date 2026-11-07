(*---
description: Evaluates a random set expression, seed 262, number 3031.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03031 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(Len(Tail(<<>>)) \div ((CHOOSE b4818 \in {1, 2} : FALSE) % ([x \in 1..2 |-> x])[-1])), ((CHOOSE b4819 \in ({1, 2} \ {1}) : (FALSE => FALSE)) + IF (\E b4820 \in Nat : TRUE) THEN Cardinality({1}) ELSE DOMAIN [x \in Nat |-> x + 1])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
