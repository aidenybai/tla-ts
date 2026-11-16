(*---
description: Evaluates a random seq expression, seed 262, number 990.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00990 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SubSeq(((TRUE <=> TRUE) => (<<>> = FALSE)), (CHOOSE b1592 \in (-1 .. 1) : (FALSE \/ TRUE)), (CHOOSE b1593 \in DOMAIN (1 :> 2) : (b1593 \in SUBSET {1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00990 failed.
    Attempted to check equality of the function <<>> with the value:
    FALSE
---*)
