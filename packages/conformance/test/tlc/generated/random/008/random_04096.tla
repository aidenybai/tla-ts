(*---
description: Evaluates a random set expression, seed 262, number 4096.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04096 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN ([(CHOOSE f \in [{} -> 2..1] : TRUE) EXCEPT ![Cardinality(SUBSET {1})] = Head(<<1>>)] @@ [(<<5, 6>> @@ (1 :> 2)) EXCEPT ![([a |-> 1]).a] = (1 * 1)]))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 26 to line 14, col 57 of module random_04096
    | {1, 2}
---*)
