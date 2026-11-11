(*---
description: "\\A x, y \\in S evaluates S once for both variables."
ref: "tlc2/tool/impl/Tool.java#contexts"
flags: [expression]
outcome: success
---*)
---- MODULE quantifier_shared_domain_evaluated_once ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
Test == \A x, y \in P(1, {1, 2}) : TRUE
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
