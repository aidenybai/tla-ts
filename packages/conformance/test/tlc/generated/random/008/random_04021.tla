(*---
description: Evaluates a random set expression, seed 262, number 4021.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04021 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({([[[a |-> 1] EXCEPT !.a = @ + 2] EXCEPT ![1] = (<<5, 6>>)[2147483647]] = [b6320 \in ([x \in Nat |-> x + 1] .. 1) |-> (<<5, 6>>)[b6320]]), IF SortSeq(Append(<<1>>, -1), LAMBDA p, q : p < q) THEN (CHOOSE b6321 \in [[a |-> 1] EXCEPT !.a = 2] : (0 = 7)) ELSE Len(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04021 failed.
    Attempted to access record by a non-string argument: 1
---*)
