(*---
description: TLCGet("all") answers in ASSUME, empty before any register is set.
ref: tlc2/module/TLCGetSet.java#TLCGetStringValue
features:
  - TLC
flags:
  - expression
contexts:
  - assume
outcome: success
---*)
---- MODULE assume_all_empty ----
EXTENDS TLC, Naturals
Test == TLCGet("all") = <<>>
====

(*--- recorded
all:
  exit: 0
---*)
