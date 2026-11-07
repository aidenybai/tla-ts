(*---
description: Evaluates a random bool expression, seed 262, number 172.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00172 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b275 \in ({b276 \in ({1, 2} \cup {1}) : (2 \in 1..3)} \cap ({b277 \in {1} : FALSE} \cap {3, 3})) : (DOMAIN [FALSE EXCEPT ![b275] = b275] = ((-1 - -1) .. ((1 :> 2))[2]))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
