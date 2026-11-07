(*---
description: Evaluates a random set expression, seed 262, number 9687.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09687 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({([[[a |-> 1] EXCEPT !.a = b15026] EXCEPT !.a = @ + IF FALSE THEN b15026 ELSE 7]).a : b15026 \in (Cardinality({0 : b15027 \in 1..3}) .. ((CHOOSE f \in [{1, 2} \cap {2} -> {1, 2} \cap {2}] : TRUE))[(-1 - 7)])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09687 failed.
    Attempted to apply function:
    (2 :> 2)
    to argument -8, which is not in the domain of the function.
---*)
