(*---
description: Values.ppr wraps a long record.
ref: tlc2/value/Values.java#ppr
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_long_record_wraps ----
EXTENDS TLC, Naturals
Test == PrintT([aaaaaaaaaaaaaaaaaaaa |-> 1000000000, bbbbbbbbbbbbbbbbbbbb |-> 1000000000, cccccccccccccccccccc |-> 1000000000, dddddddddddddddddddd |-> 1000000000])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | [ aaaaaaaaaaaaaaaaaaaa |-> 1000000000,
    |   bbbbbbbbbbbbbbbbbbbb |-> 1000000000,
    |   cccccccccccccccccccc |-> 1000000000,
    |   dddddddddddddddddddd |-> 1000000000 ]
---*)
