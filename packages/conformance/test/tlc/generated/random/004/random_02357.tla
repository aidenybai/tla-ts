(*---
description: Evaluates a random record expression, seed 262, number 2357.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02357 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (CASE FALSE -> 2147483647 [] OTHER -> -1 * IF FALSE THEN 3 ELSE 3), b |-> ((~TRUE) <=> (<<>> = [x \in 1..2 |-> x]))] EXCEPT !.a = IF (\E b3733 \in DOMAIN <<5, 6>> : (~FALSE)) THEN (-CASE FALSE -> 2 [] OTHER -> -1) ELSE Len([<<1>> EXCEPT ![1] = 2])])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 1, b |-> TRUE]"
---*)
