(*---
description: Gson's lenient parser accepts single quotes.
ref: tlc2/module/Json.java#deserialize
features:
  - Json
flags:
  - expression
outcome: success
includes:
  - fixtures/single_quote.json
---*)
---- MODULE de_lenient_single_quote ----
EXTENDS Json, TLC, Naturals
Test == JsonDeserialize("fixtures/single_quote.json") = [a |-> "b"]
====

(*--- recorded
all:
  exit: 0
---*)
