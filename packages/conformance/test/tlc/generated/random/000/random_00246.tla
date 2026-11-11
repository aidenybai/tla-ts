(*---
description: Evaluates a random set expression, seed 262, number 246.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00246 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN (CASE (\A b402 \in SUBSET {1} : TRUE) -> LET b403 == 7 IN b403 [] OTHER -> LET b404 == 2 IN b404 :> (IF TRUE THEN 1 ELSE 0 - ([x \in 1..2 |-> x])[2])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00246 failed.
    Attempted to apply the operator DOMAIN to a non-function
    (an integer)
    line 14, col 16 to line 14, col 172 of module random_00246
---*)
