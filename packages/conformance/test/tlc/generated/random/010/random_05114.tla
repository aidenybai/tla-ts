(*---
description: Evaluates a random function expression, seed 262, number 5114.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05114 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b7952 \in ({b7953 : b7953 \in {}} \cup {b7954 : b7954 \in {1}}) |-> ([[a |-> 1] EXCEPT !.a = @ + b7952]).a] @@ (CHOOSE f \in [{0} \cup {1} -> 1..2] : TRUE)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (0 :> 1 @@ 1 :> 2)"
---*)
