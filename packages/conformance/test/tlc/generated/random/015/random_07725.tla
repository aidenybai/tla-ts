(*---
description: Evaluates a random record expression, seed 262, number 7725.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07725 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 1]).a, b |-> (Len(<<>>) = LET b11913 == 1 IN -1)] EXCEPT !.a = (CHOOSE b11914 \in UNION {(1..3 \cap SUBSET {1}), {b11915 \in {x \in 1..3 : x > 1} : TRUE}} : ((Nat \cup {1}) \subseteq {b11916 \in Nat : FALSE}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07725 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
