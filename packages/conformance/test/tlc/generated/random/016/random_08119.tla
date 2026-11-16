(*---
description: Evaluates a random int expression, seed 262, number 8119.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08119 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((<<5, 6>> @@ <<5, 6>>))[([x \in 1..2 |-> x])[2]] - ((2 - b12549) + (b12549 - b12549))) : b12549 \in ({IF FALSE THEN 7 ELSE 3, IF TRUE THEN 7 ELSE 2147483647} \ UNION {UNION {1..3, {1}}, DOMAIN [x \in 1..2 |-> x]})})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {11}"
---*)
