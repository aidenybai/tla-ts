(*---
description: "Enumerating a set of records raw varies the last sorted field fastest."
ref: "tlc2/value/impl/SetOfRcdsValue.java#Enumerator"
flags: [expression]
outcome: success
---*)
---- MODULE record_set_filter_last_field_fastest ----
EXTENDS Integers, TLC
Test == {r \in [zc : {1, 2}, zd : {1, 2}] : PrintT(<<r.zc, r.zd>>)} # {}
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
