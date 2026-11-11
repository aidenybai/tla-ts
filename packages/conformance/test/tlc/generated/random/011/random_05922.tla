(*---
description: Evaluates a random function expression, seed 262, number 5922.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05922 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{0} \cup {1} -> {1}] : TRUE) EXCEPT ![[b9129 \in {b9130 \in ({2, 1, 3} \cap {x \in 1..3 : x > 1}) : (TRUE <=> FALSE)} |-> ((CHOOSE r \in [a : {1, 2}] : TRUE))[(b9129 + 0)]]] = (-((CHOOSE b9131 \in {} : TRUE) \div (-1 % 3)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05922 failed.
    Attempted to check equality of integer 0 with non-integer:
    <<>>
---*)
