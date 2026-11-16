(*---
description: An empty sequence writes an empty file.
ref: tlc2/module/Json.java#ndSerialize
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE nd_se_empty ----
EXTENDS Json, TLC, Naturals
Test == ndJsonSerialize("out.ndjson", <<>>) /\ ndJsonDeserialize("out.ndjson") = <<>>
====

(*--- recorded
all:
  exit: 0
---*)
