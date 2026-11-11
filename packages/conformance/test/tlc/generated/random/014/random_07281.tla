(*---
description: Evaluates a random bool expression, seed 262, number 7281.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07281 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b11213 \in ((1..3 \ {2, 1, 3}) \cap ({1} = {2, 1, 3})) : (({} \ SUBSET {1}) \subseteq {7, b11213})} \subseteq {b11214 \in (IF TRUE THEN 2147483647 ELSE 7 .. Len(<<1>>)) : (CHOOSE r \in [a : 2..1] : TRUE)}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
