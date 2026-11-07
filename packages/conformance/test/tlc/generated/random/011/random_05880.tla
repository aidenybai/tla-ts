(*---
description: Evaluates a random set expression, seed 262, number 5880.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05880 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b9067 \in DOMAIN ((1 :> 2) @@ TRUE) : ((TRUE => TRUE) <=> (\E b9068 \in Nat : FALSE))} \cup (SelectSeq(SelectSeq([a |-> 1, b |-> TRUE], LAMBDA e : e > 0), LAMBDA e : e > 0) \cup ((CHOOSE b9069 \in {} : TRUE) .. (CHOOSE b9070 \in Nat : [x \in Nat |-> x + 1])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of @@ should be a function, but instead it is:
    TRUE
    2169:0 The second argument of @@ should be a function, but instead it is:
    TRUE
---*)
