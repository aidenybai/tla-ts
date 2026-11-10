(*---
description: Evaluates a random set expression, seed 262, number 3888.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03888 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {((({x \in 1..3 : x > 1} \ SUBSET {1}) \cap DOMAIN <<5, 6>>) \cap {b6120 \in ({x \in 1..3 : x > 1} \cup {1}) : (FALSE \/ FALSE)}), {b6121 \in ((2 .. TRUE) \ {-1 : b6122 \in SUBSET {1}}) : ((CHOOSE b6123 \in {x \in 1..3 : x > 1} : TRUE) \in {b6121, b6121})}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03888 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
