(*---
description: Evaluates a random bool expression, seed 262, number 4453.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04453 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> Len(SelectSeq(<<>>, LAMBDA e : e > 0)), b |-> ((FALSE <=> TRUE) <=> (\A b7012 \in {x \in 1..3 : x > 1} : FALSE))] = ((Cardinality(1..3) < (-7)) \/ (\E b7013 \in ({} \ {1, 2}) : (<<>> = (1 :> 2))))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04453 failed.
    Attempted to check equality of record:
    [a |-> 0, b |-> TRUE]
    with non-record
    FALSE
---*)
