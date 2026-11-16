(*---
description: TLCGet("revision") has these fields. The values depend on the build.
ref: tlc2/module/TLCGetSet.java#TLCGetStringValue
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE revision_domain ----
EXTENDS TLC, Naturals
Test == DOMAIN TLCGet("revision") = {"count", "timestamp", "date", "tag", "calver"}
====

(*--- recorded
all:
  exit: 0
---*)
