(*---
description: Evaluates a random set expression, seed 262, number 2113.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02113 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF (0 \in TRUE) THEN (-1 * 2) ELSE (~TRUE) .. Head(Append(<<>>, 7))) \cap (UNION {{b3354 \in 2..1 : FALSE}, ({1, 2} \cup {2, 1, 3})} \cup ({1 : b3355 \in SUBSET {1}} \ ([a |-> 1] \cap {1, 2})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02113 failed.
    Attempted to check if the value:
    0
    is an element of the boolean TRUE
---*)
