(*---
description: A LET definition without parameters prints once however often it is used.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_let_once ----
EXTENDS TLC, Naturals
Test == LET once == PrintT("once") IN once /\ once
====

(*--- recorded
all:
  exit: 0
  transcript: '| "once"'
---*)
