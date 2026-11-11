(*---
description: Evaluates a random function expression, seed 262, number 2859.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02859 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b4529 \in ({IF FALSE THEN b4530 ELSE 3 : b4530 \in UNION {1..3, Nat}} \ {(b4531 = -1) : b4531 \in (Nat \cap 2..1)}) |-> (Len(<<b4529, 7>>) \div Cardinality({b4532 \in SUBSET {1} : TRUE}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02859 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    1..3
---*)
