(*---
description: Evaluates a random bool expression, seed 262, number 5049.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05049 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b7851 \in {(CHOOSE b7853 \in (Nat \cap {2, 1, 3}) : (TRUE \/ TRUE)) : b7852 \in {b7854 \in DOMAIN <<5, 6>> : (0 = b7854)}} : (Cardinality({b7855 \in {x \in 1..3 : x > 1} : TRUE}) :> Len((<<1>> \o <<>>)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
