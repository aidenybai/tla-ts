(*---
description: Evaluates a random bool expression, seed 262, number 7708.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07708 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b11886 \in UNION {(DOMAIN (1 :> 2) \cap ({2, 1, 3} \ Nat)), ({b11887 \in 2..1 : FALSE} \ (Nat \ {x \in 1..3 : x > 1}))} : (\A b11888 \in (IF TRUE THEN 3 ELSE 2 .. LET b11889 == b11886 IN 7) : ((b11886 = 2147483647) <=> (2147483647 = 0)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
