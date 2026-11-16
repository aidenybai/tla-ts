(*---
description: TLCGet("config") answers in ASSUME.
ref: tlc2/module/TLCGetSet.java#TLCGetStringValue
features:
  - TLC
flags:
  - expression
contexts:
  - assume
outcome: success
---*)
---- MODULE assume_config ----
EXTENDS TLC, Naturals
Test == TLCGet("config").mode = "bfs"
====

(*--- recorded
all:
  exit: 0
---*)
