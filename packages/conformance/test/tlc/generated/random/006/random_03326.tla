(*---
description: Evaluates a random int expression, seed 262, number 3326.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03326 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b5288 \in (((-0) .. (<<5, 6>>)[{2, 1, 3}]) \ ({b5289 \in SUBSET {1} : FALSE} \cup ({1, 2} \ {}))) : (((b5288 :> b5288))[(-b5288)] < IF ({1, 2} = {1}) THEN (3 - b5288) ELSE IF TRUE THEN 1 ELSE 2147483647)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03326 failed.
    Attempted to access tuple at a non integral index: {1, 2, 3}
---*)
