(*---
description: Evaluates a random record expression, seed 262, number 1723.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01723 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = ((IF TRUE THEN 1 ELSE 2 * (7 + 2)) - ((CHOOSE f \in [{} -> {1, 2} \cap {2}] : TRUE))[(<<>> = [x \in 1..2 |-> x])])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01723 failed.
    Attempted to apply function:
    <<>>
    to argument FALSE, which is not in the domain of the function.
---*)
