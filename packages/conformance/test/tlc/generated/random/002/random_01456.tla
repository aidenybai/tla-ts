(*---
description: Evaluates a random bool expression, seed 262, number 1456.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01456 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SelectSeq(SubSeq(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0), (7 * 2), ([a |-> 1]).a), LAMBDA e : e > 0), ((-(CHOOSE f \in [{1, 2} \ {1} -> 2..1] : TRUE)) + ((3 \div 7) % (CHOOSE b2327 \in 1..3 : TRUE))), (CHOOSE b2328 \in ((CHOOSE r \in [a : {1, 2}] : TRUE) \cup ([a |-> 1]).a) : ((<<1>> /\ FALSE) /\ ([a |-> 1] = [a |-> 1])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01456 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 130 to line 14, col 171 of module random_01456
---*)
