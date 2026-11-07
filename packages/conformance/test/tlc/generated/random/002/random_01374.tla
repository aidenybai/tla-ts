(*---
description: Evaluates a random seq expression, seed 262, number 1374.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01374 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(Append(SubSeq(SubSeq(<<3, 1, 2>>, 2147483647, 1), IF FALSE THEN -1 ELSE 7, (CHOOSE b2192 \in {1} : TRUE)), IF (SUBSET {1} \subseteq {x \in 1..3 : x > 1}) THEN ([a |-> 1, b |-> TRUE]).a ELSE (1 * 0)), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01374 failed.
    Attempted to compare the set {} with the value:
    3
---*)
