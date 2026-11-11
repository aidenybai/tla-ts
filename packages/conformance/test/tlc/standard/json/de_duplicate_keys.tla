(*---
description: With a key given twice, the last one wins.
ref: tlc2/module/Json.java#getRecordValue
features:
  - Json
flags:
  - expression
outcome: success
includes:
  - fixtures/dup.json
---*)
---- MODULE de_duplicate_keys ----
EXTENDS Json, TLC, Naturals
Test == JsonDeserialize("fixtures/dup.json").a = 2
====

(*--- recorded
all:
  exit: 0
---*)
