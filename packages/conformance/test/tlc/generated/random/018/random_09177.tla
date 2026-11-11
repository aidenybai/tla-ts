(*---
description: Evaluates a random bool expression, seed 262, number 9177.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09177 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((UNION {UNION {SUBSET {1}, 1..3}, (1..3 \cup {1, 2})} \cap ((SUBSET {1} \cap 1..3) \cup DOMAIN [x \in 1..2 |-> x])) = {LET b14249 == (CHOOSE b14250 \in {1} : FALSE) IN (FALSE * 3), Len(SelectSeq(<<1, 2>>, LAMBDA e : e > 0))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09177 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
