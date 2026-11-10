(*---
description: Evaluates a random seq expression, seed 262, number 8828.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08828 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({((b13670 % b13670) * Cardinality({})) : b13670 \in {CASE FALSE -> 1 [] OTHER -> 2, (CHOOSE b13671 \in <<1>> : TRUE)}} \ {IF (\E b13672 \in 2..1 : TRUE) THEN ([a |-> 1]).a ELSE LET b13673 == 0 IN b13673, ((-7) \div ([a |-> 1]).a)}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08828 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 102 to line 14, col 131 of module random_08828
---*)
