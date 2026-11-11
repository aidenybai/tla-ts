(*---
description: Evaluates a random function expression, seed 262, number 2589.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02589 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b4078 == (LET b4079 == 0 IN b4079 - (0 + 1)) IN {(b4080 - b4078) : b4080 \in UNION {1..3, {1}}} :> (CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({2, 3, 4} :> [a |-> 2])"
---*)
