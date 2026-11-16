(*---
description: Evaluates a random set expression, seed 262, number 4280.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04280 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({((b6737 * b6737) % ([a |-> 1, b |-> TRUE]).a) : b6737 \in [b6738 \in {b6739 \in {} : FALSE} |-> (b6738 \div b6738)]} \ {(Cardinality(1..3) - (-7)), (CASE TRUE -> 7 [] OTHER -> 3 % (1 + 2))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04280 failed.
    TLC encountered a non-enumerable quantifier bound
    <<>>.
    line 14, col 76 to line 14, col 132 of module random_04280
---*)
