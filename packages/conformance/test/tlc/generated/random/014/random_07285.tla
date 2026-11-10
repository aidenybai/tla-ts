(*---
description: Evaluates a random seq expression, seed 262, number 7285.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07285 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(Tail(SortSeq(Tail(<<1, 2>>), LAMBDA p, q : p < q)), ((Head(<<5, 6>>) * Cardinality({2, 1, 3})) * (CHOOSE b11218 \in ([a |-> 1, b |-> TRUE] \cup SUBSET {1}) : (2..1 = 1..3))), (({[x \in 1..2 |-> x], 3} * ([a |-> 1] + 2)) * CASE (\A b11219 \in [x \in 1..2 |-> x] : TRUE) -> ([a |-> 1]).a [] OTHER -> (2 * 7))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07285 failed.
    Attempted to enumerate S \cup T when S:
    [a |-> 1, b |-> TRUE]
    and T:
    {{}, {1}}
    are not both enumerable
---*)
