(*---
description: Evaluates a random set expression, seed 262, number 5086.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05086 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {UNION {({2, 1, 3} \cap {}), DOMAIN [x \in 1..2 |-> x]}, DOMAIN (CHOOSE f \in [2..1 -> {1, 2} \cap {2}] : TRUE)} \cap DOMAIN (CASE FALSE -> 7 [] OTHER -> 7 :> LET b7914 == 7 IN -1)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
