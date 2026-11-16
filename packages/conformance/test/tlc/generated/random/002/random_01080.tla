(*---
description: Evaluates a random bool expression, seed 262, number 1080.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01080 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b1722 \in {b1723 \in ((-1 .. -1) \cup ({1} \ {x \in 1..3 : x > 1})) : ({b1724 \in SUBSET {1} : FALSE} = (3 .. b1723))} : (\E b1725 \in DOMAIN (1 :> 0) : ((b1725 \in Nat) => (FALSE => TRUE)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
