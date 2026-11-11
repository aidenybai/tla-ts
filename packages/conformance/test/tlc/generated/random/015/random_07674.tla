(*---
description: Evaluates a random function expression, seed 262, number 7674.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07674 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{1, 2} -> 1..2] : TRUE) @@ [b11813 \in {b11814 \in {b11815 \in {} : TRUE} : ((1 :> 2) \in {x \in 1..3 : x > 1})} |-> (CHOOSE b11816 \in (3 .. 1) : (TRUE => TRUE))]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 1>>"
---*)
