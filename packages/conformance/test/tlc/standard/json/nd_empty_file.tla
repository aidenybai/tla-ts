(*---
description: An empty file is the empty tuple.
ref: tlc2/module/Json.java#ndDeserialize
features:
  - Json
flags:
  - expression
outcome: success
includes:
  - fixtures/empty.ndjson
---*)
---- MODULE nd_empty_file ----
EXTENDS Json, TLC, Naturals
Test == ndJsonDeserialize("fixtures/empty.ndjson") = <<>>
====

(*--- recorded
all:
  exit: 0
---*)
