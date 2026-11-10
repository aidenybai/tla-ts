(*---
description: Evaluates a random record expression, seed 262, number 3213.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03213 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Cardinality(({1, 2} \cap {2, 1, 3})), b |-> (CASE FALSE -> 1 [] OTHER -> 2 \in UNION {Nat, 2..1})] EXCEPT !.a = @ + ((CHOOSE f \in [{0} \cup {1} -> {1, 2} \cap {2}] : TRUE) - (LET b5103 == 7 IN 2147483647 % Head(<<>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03213 failed.
    Attempted to compare the set {} with the value:
    Nat
---*)
