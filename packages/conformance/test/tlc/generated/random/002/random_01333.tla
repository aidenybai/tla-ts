(*---
description: Evaluates a random function expression, seed 262, number 1333.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01333 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((CHOOSE f \in [{0} \cup {1} -> {1, 2} \ {1}] : TRUE) :> ((7 :> 2147483647))[({2, 1, 3} \ {2, 1, 3})]) EXCEPT ![(((CHOOSE b2135 \in {x \in 1..3 : x > 1} : TRUE) :> Head(<<3, 1, 2>>)))[Len((2 :> 2))]] = (((2 + 7) \div IF TRUE THEN 3 ELSE 3) + Cardinality((2..1 \cup {1, 2})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01333 failed.
    Attempted to check equality of integer 7 with non-integer:
    {}
---*)
