(*---
description: '"a" :> v equals the record [a |-> v] and takes field selection.'
ref: tlc2/module/TLC.java#MakeFcn
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE colon_greater_string_key_is_record ----
EXTENDS TLC, Naturals
Test == ("a" :> 1) = [a |-> 1] /\ ("a" :> 1).a = 1
====

(*--- recorded
all:
  exit: 0
---*)
