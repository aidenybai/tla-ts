(*---
description: Evaluates a random bool expression, seed 262, number 8998.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08998 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((<<(0 * 7), ([a |-> 1]).a>> = [b13973 \in (SUBSET {1} \cap {2, 1, 3}) |-> Len(<<1, 2>>)]) => ((CHOOSE b13974 \in {b13975 : b13975 \in {}} : ({} = Nat)) = Cardinality({2 : b13976 \in Nat}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08998 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
