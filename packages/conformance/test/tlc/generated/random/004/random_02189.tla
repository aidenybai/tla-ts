(*---
description: Evaluates a random record expression, seed 262, number 2189.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02189 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Head(({2, 1, 3} \subseteq SUBSET {1})), b |-> ((<<3, 1, 2>> = <<5, 6>>) => (TRUE \/ TRUE))] EXCEPT !.a = IF (SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q) = [[x \in Nat |-> x + 1] EXCEPT ![0] = 1]) THEN LET b3449 == (CHOOSE b3450 \in <<1, 2>> : FALSE) IN ({} + 7) ELSE Head((<<1>> \o <<>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02189 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
