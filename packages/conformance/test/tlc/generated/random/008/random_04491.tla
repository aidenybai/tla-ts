(*---
description: Evaluates a random bool expression, seed 262, number 4491.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04491 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\A b7054 \in {b7055 \in ({1, 2} \cup {x \in 1..3 : x > 1}) : ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])} : ({2, 0} \subseteq DOMAIN [x \in Nat |-> x + 1])) \/ (((CHOOSE b7056 \in {x \in 1..3 : x > 1} : FALSE) .. (-2)) \subseteq {b7057 \in (1..3 \cup {1, 2}) : (~FALSE)})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
