(*---
description: A SPECIFICATION may give only one [][Next]_v.
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec
outcome: config-error
config: |
  SPECIFICATION Spec
---*)
---- MODULE two_boxes ----
VARIABLE x
Init == x = 0
A == x' = x
B == x' = x
Spec == Init /\ [][A]_x /\ [][B]_x
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2240:1 The specification contains more than one conjunct of the form [][Next]_v,
    but TLC can handle only specifications with one next-state relation.
---*)
