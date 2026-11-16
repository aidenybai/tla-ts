(*---
description: Evaluates a random set expression, seed 262, number 465.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00465 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(SelectSeq(<<2, 2147483647>>, LAMBDA e : e > 0)) .. ((CHOOSE f \in [{1, 2} \cap {2} -> {1}] : TRUE))[([b769 \in {1} |-> b769])[[<<1, 2>> EXCEPT ![1] = 1]]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00465 failed.
    Attempted to check equality of integer 1 with non-integer:
    <<1, 2>>
---*)
