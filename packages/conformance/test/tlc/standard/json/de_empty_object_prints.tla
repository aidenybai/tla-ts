(*---
description: An empty record prints in record form.
ref: tlc2/module/Json.java#getRecordValue
features:
  - Json
flags:
  - expression
outcome: success
includes:
  - fixtures/empty_object.json
---*)
---- MODULE de_empty_object_prints ----
EXTENDS Json, TLC, Naturals
Test == PrintT(JsonDeserialize("fixtures/empty_object.json"))
====

(*--- recorded
all:
  exit: 0
  transcript: "| []"
---*)
