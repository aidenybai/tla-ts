(*---
description: 1 :> v prints as a tuple since its domain is 1..1.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_colon_greater_one_is_sequence ----
EXTENDS TLC, Naturals
Test == PrintT(1 :> "a")
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"a">>'
---*)
