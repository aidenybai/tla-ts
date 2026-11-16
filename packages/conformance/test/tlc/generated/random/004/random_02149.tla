(*---
description: Evaluates a random function expression, seed 262, number 2149.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02149 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((2147483647 + 2) + (CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)) :> ((CHOOSE b3397 \in {} : TRUE) \div (7 \div 0))) @@ (CHOOSE f \in [{1} -> {1, 2}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02149 failed.
    2178:0 Overflow when computing 2147483647+2
---*)
