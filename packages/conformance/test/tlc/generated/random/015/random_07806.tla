(*---
description: Evaluates a random seq expression, seed 262, number 7806.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07806 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(<<((CHOOSE f \in [{1, 2} \cap {2} -> {1, 2} \cap {2}] : TRUE))[IF FALSE THEN 7 ELSE 7], LET b12042 == (CHOOSE r \in [a : {0} \cup {1}] : TRUE) IN (-b12042)>>, LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07806 failed.
    Attempted to apply function:
    (2 :> 2)
    to argument 7, which is not in the domain of the function.
---*)
