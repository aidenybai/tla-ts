(*---
description: 'PrintT normalizes deeply, the 2011 fix: {"a", "a"} prints with one element.'
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_set_deduplicated ----
EXTENDS TLC, Naturals
Test == PrintT({"a", "a"})
====

(*--- recorded
all:
  exit: 0
  transcript: '| {"a"}'
---*)
