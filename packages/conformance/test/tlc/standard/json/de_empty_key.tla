(*---
description: An empty key is allowed.
ref: tlc2/module/Json.java#getRecordValue
features:
  - Json
flags:
  - expression
outcome: success
includes:
  - fixtures/empty_key.json
---*)
---- MODULE de_empty_key ----
EXTENDS Json, TLC, Naturals
Test == JsonDeserialize("fixtures/empty_key.json")[""] = 1
====

(*--- recorded
all:
  exit: 0
---*)
