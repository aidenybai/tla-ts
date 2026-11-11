(*---
description: Evaluates a random record expression, seed 262, number 9004.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09004 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (((CHOOSE f \in [{1} -> {2, 1, 3}] : TRUE))[(-3)] - Tail(SubSeq(<<3, 1, 2>>, 0, 3))), b |-> (((FALSE => TRUE) \/ (2..1 \subseteq 1..3)) <=> ((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) = [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09004 failed.
    Attempted to apply function:
    <<1>>
    to argument -3, which is not in the domain of the function.
---*)
