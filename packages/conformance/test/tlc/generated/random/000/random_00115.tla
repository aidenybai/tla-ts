(*---
description: Evaluates a random bool expression, seed 262, number 115.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00115 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({b173 \in Nat : TRUE} \ {3 : b174 \in {1, 2}}) \cap (UNION {SUBSET {1}, 1..3} \cap ({} \cap 2..1))) \subseteq DOMAIN ([<<5, 6>> EXCEPT ![2] = 2147483647] @@ Tail(<<1, 2>>))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
