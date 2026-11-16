(*---
description: Evaluates a random set expression, seed 262, number 2600.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02600 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> CASE (<<1>> = TRUE) -> IF TRUE THEN 1 ELSE 2147483647 [] OTHER -> (CHOOSE b4095 \in SUBSET {1} : FALSE), b |-> ({3, 2} = {b4096 : b4096 \in Nat})]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02600 failed.
    Attempted to check equality of the function <<1>> with the value:
    TRUE
---*)
