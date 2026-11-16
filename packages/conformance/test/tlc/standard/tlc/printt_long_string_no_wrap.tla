(*---
description: Values.ppr does not break a long string.
ref: tlc2/value/Values.java#ppr
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_long_string_no_wrap ----
EXTENDS TLC, Naturals
Test == PrintT("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
====

(*--- recorded
all:
  exit: 0
  transcript: '| "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"'
---*)
