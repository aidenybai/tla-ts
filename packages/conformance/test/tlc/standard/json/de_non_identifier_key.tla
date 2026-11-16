(*---
description: A key that is no identifier is reached by indexing.
ref: tlc2/module/Json.java#getRecordValue
features:
  - Json
flags:
  - expression
outcome: success
includes:
  - fixtures/weird_key.json
---*)
---- MODULE de_non_identifier_key ----
EXTENDS Json, TLC, Naturals
Test == JsonDeserialize("fixtures/weird_key.json")["a b"] = 1
====

(*--- recorded
all:
  exit: 0
---*)
