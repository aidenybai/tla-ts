(*---
description: Evaluates a random set expression, seed 262, number 3316.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03316 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE (\E b5269 \in DOMAIN (1 :> 2) : (\A b5270 \in {} : FALSE)) -> (CHOOSE b5271 \in (1 .. 7) : (b5271 \in Nat)) [] OTHER -> LET b5272 == (7 - 3) IN CASE TRUE -> b5272 [] OTHER -> b5272 .. (CHOOSE f \in [{1, 2} \cap {2} -> {1, 2}] : TRUE)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
