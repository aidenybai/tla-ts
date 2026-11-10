(*---
description: Evaluates a random function expression, seed 262, number 3711.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03711 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[((1 :> 2) @@ (1 :> 2)) EXCEPT ![([a |-> 1]).a] = {b5863 \in {} : TRUE}] EXCEPT ![((CHOOSE f \in [{} -> 2..1] : TRUE))[(CHOOSE b5864 \in 0 : FALSE)]] = Head((<<1>> \o <<3, 1, 2>>))] EXCEPT ![Len(SortSeq(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), LAMBDA p, q : p < q))] = ((([x \in Nat |-> x + 1])[3] - (3 + 0)) % (CHOOSE b5865 \in {-1 : b5866 \in {1}} : (\A b5867 \in Nat : FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03711 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 138 to line 14, col 163 of module random_03711
---*)
