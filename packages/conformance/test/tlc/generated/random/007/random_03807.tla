(*---
description: Evaluates a random record expression, seed 262, number 3807.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03807 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> IF (({1} \cap {1}) \subseteq {1 : b6003 \in SUBSET {1}}) THEN IF ({2, 1, 3} = {x \in 1..3 : x > 1}) THEN (~FALSE) ELSE IF FALSE THEN 7 ELSE 2147483647 ELSE (IF FALSE THEN -1 ELSE -1 + (1 % 2)), b |-> (Len(Append(<<1>>, 7)) \in DOMAIN (2 :> 0))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 2147483647, b |-> TRUE]"
---*)
