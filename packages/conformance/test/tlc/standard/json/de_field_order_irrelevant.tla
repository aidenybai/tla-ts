(*---
description: A record from JSON equals a record with fields in another order.
ref: tlc2/module/Json.java#getRecordValue
features:
  - Json
flags:
  - expression
outcome: success
includes:
  - fixtures/order.json
---*)
---- MODULE de_field_order_irrelevant ----
EXTENDS Json, TLC, Naturals
Test == JsonDeserialize("fixtures/order.json") = [a |-> 2, b |-> 1]
====

(*--- recorded
all:
  exit: 0
---*)
