(*---
description: Evaluates a random int expression, seed 262, number 1429.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01429 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{0} \cup {1} -> {1, 2} \cap {2}] : TRUE) EXCEPT !.a = ((Cardinality(SUBSET {1}) * {2147483647, 3}) % (CHOOSE b2284 \in (<<1, 2>> \cap 2..1) : (CHOOSE b2285 \in {1, 2} : TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01429 failed.
    Attempted to check equality of integer 0 with non-integer:
    "a"
---*)
