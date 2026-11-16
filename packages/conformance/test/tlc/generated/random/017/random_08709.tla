(*---
description: Evaluates a random set expression, seed 262, number 8709.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08709 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {{b13485 \in {LET b13487 == 2 IN b13487 : b13486 \in DOMAIN (1 :> 2)} : (DOMAIN <<5, 6>> = {-1 : b13488 \in 2..1})}, ({(-0), ([a |-> 1]).a} \cap (({} \ {1}) \cup {2147483647, 3}))})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
