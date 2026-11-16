(*---
description: Format NDJSON writes through the override, returning TRUE.
ref: tlc2/module/Json.java#textSerialize
features:
  - Json
flags:
  - expression
outcome: success
includes:
  - IOUtils.tla
---*)
---- MODULE text_ndjson_round_trip ----
EXTENDS Json, IOUtils, TLC, Naturals
Test == Serialize(<<1, "a">>, "out.ndjson", [format |-> "NDJSON", charset |-> "UTF-8", openOptions |-> <<"WRITE", "CREATE", "TRUNCATE_EXISTING">>]) = TRUE /\ ndJsonDeserialize("out.ndjson") = <<1, "a">>
====

(*--- recorded
all:
  exit: 0
---*)
