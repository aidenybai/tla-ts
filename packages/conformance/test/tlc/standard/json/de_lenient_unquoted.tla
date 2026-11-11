(*---
description: Gson's lenient parser accepts an unquoted name and string.
ref: tlc2/module/Json.java#deserialize
features:
  - Json
flags:
  - expression
outcome: success
includes:
  - fixtures/unquoted.json
---*)
---- MODULE de_lenient_unquoted ----
EXTENDS Json, TLC, Naturals
Test == JsonDeserialize("fixtures/unquoted.json") = [a |-> "b"]
====

(*--- recorded
all:
  exit: 0
---*)
