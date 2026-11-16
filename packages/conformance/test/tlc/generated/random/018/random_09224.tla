(*---
description: Evaluates a random int expression, seed 262, number 9224.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09224 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((7 :> 7))[(1 - 3)] + ((0 + 2) + (2147483647 \div 2147483647))) + (CHOOSE b14315 \in ({b14316 : b14316 \in SUBSET {1}} \cup {2147483647, 2147483647}) : ({b14317 \in Nat : TRUE} \subseteq (<<1, 2>> \cap Nat)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09224 failed.
    Attempted to apply function:
    (7 :> 7)
    to argument -2, which is not in the domain of the function.
---*)
