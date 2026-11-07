(*---
description: Evaluates a random set expression, seed 262, number 2209.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02209 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b3474 \in (((0 .. 2) \cup ({1} \cap {1})) \cap {LET b3475 == -1 IN 2147483647, IF FALSE THEN 0 ELSE -1}) : ({(1 % b3474) : b3476 \in [[a |-> 1] EXCEPT !.a = @ + b3474]} = (DOMAIN (1 :> 2) \cup DOMAIN <<5, 6>>))})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
