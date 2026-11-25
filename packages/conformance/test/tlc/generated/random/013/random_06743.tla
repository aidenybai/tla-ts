(*---
description: Evaluates a random bool expression, seed 262, number 6743.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
  - tlc-bug
flags:
  - expression
contexts:
  - assume
outcome: any
correct:
  all:
    exit: 10
    transcript: |-
      2105:1 Evaluating assumption line 23, col 8 to line 23, col 11 of module random_06743 failed.
      Attempted to compare integer 0 with non-integer:
      UNION({{{}, {1}}, 1..3}) \ {1, 2}
---*)
---- MODULE random_06743 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(UNION {1..3, SUBSET {1}} \ {b10333 : b10333 \in {1, 2}}), (-Cardinality(2..1))} \subseteq {b10334 \in {([x \in Nat |-> x + 1])[0] : b10335 \in {b10336 \in SUBSET {1} : FALSE}} : ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 7] = [[a |-> 1] EXCEPT !.a = @ + 3])}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 23, col 8 to line 23, col 11 of module random_06743 failed.
    Attempted to compare integer 1 with non-integer:
    {1}
---*)
