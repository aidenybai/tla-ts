(*---
description: Evaluates a random function expression, seed 262, number 8068.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08068 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{0} \cup {1} -> {1, 2} \cap {2}] : TRUE) EXCEPT ![((CHOOSE f \in [{0} \cup {1} -> {0} \cup {1}] : TRUE))[((2 * 7) % (1 * 3))]] = Cardinality(((-3) .. (0 \div 1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08068 failed.
    Attempted to apply function:
    (0 :> 0 @@ 1 :> 0)
    to argument 2, which is not in the domain of the function.
---*)
