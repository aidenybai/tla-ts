(*---
description: Evaluates a random record expression, seed 262, number 2779.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02779 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)).a, b |-> ((1..3 \ Nat) = UNION {Nat, {1}})] EXCEPT !.a = @ + (IF ({x \in 1..3 : x > 1} \cup 1..3) THEN Cardinality({2, 1, 3}) ELSE Cardinality({}) % Head(Len(<<1>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02779 failed.
    Attempted to compare the set {1} with the value:
    Nat
---*)
