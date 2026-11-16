(*---
description: Parent directories are created.
ref: tlc2/module/Json.java#ndSerialize
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE nd_se_parent_dirs ----
EXTENDS Json, TLC, Naturals
Test == ndJsonSerialize("sub/out.ndjson", <<1>>) /\ ndJsonDeserialize("sub/out.ndjson") = <<1>>
====

(*--- recorded
all:
  exit: 0
---*)
