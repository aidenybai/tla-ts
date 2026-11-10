(*---
description: "A LET definition runs when the body first reaches it, after the earlier parts of the body."
ref: "tlc2/tool/impl/Tool.java#evalImplLetInKind"
flags: [expression]
outcome: success
---*)
---- MODULE definition_runs_after_earlier_body_parts ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
Test == LET a == P(2, 1) IN P(1, TRUE) /\ a = 1
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 1
    | 2
---*)
