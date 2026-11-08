(*---
description: Evaluates a random set expression, seed 262, number 4931.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04931 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((DOMAIN [x \in 1..2 |-> x] \cup {b7666 \in SUBSET {1} : TRUE}) \ {(-7), (-1 + 2)}) \cup UNION {{b7667 \in (3 .. 0) : (TRUE /\ FALSE)}, {(CHOOSE b7669 \in {1, 2} : TRUE) : b7668 \in DOMAIN (1 :> 2)}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04931 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the set {} with the value:
    1
---*)
