(*---
description: Evaluates a random bool expression, seed 262, number 6413.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06413 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(([x \in Nat |-> x + 1])[b9868] % (-b9868)) : b9868 \in {b9869 \in DOMAIN <<5, 6>> : (TRUE => FALSE)}} = {b9870 \in {b9871 \in ({} \cap 1..3) : (\E b9872 \in {} : FALSE)} : ((b9870 + 1) < IF FALSE THEN 2147483647 ELSE b9870)}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
