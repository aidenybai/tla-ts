(*---
description: Evaluates a random bool expression, seed 262, number 1971.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01971 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-Len((<<>> \o <<1>>))) = ((CHOOSE f \in [{1, 2} \cap {2} -> {1, 2} \ {1}] : TRUE))[CASE (2 < 2147483647) -> (3 \div 3) [] OTHER -> ([a |-> 1]).a]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01971 failed.
    Attempted to apply function:
    (2 :> 2)
    to argument 1, which is not in the domain of the function.
---*)
