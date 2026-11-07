(*---
description: Evaluates a random set expression, seed 262, number 6436.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06436 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b9903 \in (((CHOOSE f \in [2..1 -> {1}] : TRUE))[(1 \div 2147483647)] .. IF (\A b9904 \in {1} : TRUE) THEN (-1) ELSE (0 + 3)) : ((Tail(<<1>>) \o [<<1, 2>> EXCEPT ![1] = b9903]) = [b9905 \in ({} \cap 1..3) |-> (<<5, 6>> % b9905)])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06436 failed.
    Attempted to apply function:
    <<>>
    to argument 0, which is not in the domain of the function.
---*)
