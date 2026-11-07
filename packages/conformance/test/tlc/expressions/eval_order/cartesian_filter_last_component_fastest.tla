(*---
description: "Enumerating S \\X T raw, as a filter does, varies the last component fastest."
ref: "tlc2/value/impl/SetOfTuplesValue.java#Enumerator"
flags: [expression]
outcome: success
---*)
---- MODULE cartesian_filter_last_component_fastest ----
EXTENDS Integers, TLC
Test == {t \in {1, 2} \X {1, 2} : PrintT(t)} # {}
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | <<1, 1>>
    | <<1, 2>>
    | <<2, 1>>
    | <<2, 2>>
---*)
