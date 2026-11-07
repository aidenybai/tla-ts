(*---
description: Evaluates a random function expression, seed 262, number 9080.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09080 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(Cardinality(UNION {{}, 2..1}) :> Cardinality(<<1, 3>>)) EXCEPT ![IF ((CHOOSE b14113 \in {} : TRUE) \in UNION {{}, Nat}) THEN Head({2 : b14114 \in Nat}) ELSE ([b14115 \in {x \in 1..3 : x > 1} |-> b14115])[(7 - 1)]] = (Cardinality(DOMAIN [x \in Nat |-> x + 1]) - [b14116 \in ({x \in 1..3 : x > 1} \ Nat) |-> (-b14116)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    <<1, 3>>
    2181:0 Attempted to compute cardinality of the value
    <<1, 3>>
---*)
